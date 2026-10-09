"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  MUSIC_TRACKS,
  VIDEO_TEMPLATE,
  type PipSide,
  type TeamMemberCount,
} from "@/lib/template";
import {
  autoArrangePhotos,
  getOutputDuration,
  movePhotoBlock,
  reorderPhotos,
  resizePhotoEnd,
  resizePhotoStart,
  trimBounds,
} from "@/lib/timeline";
import {
  createEmptyTeamPhoto,
  filledTeamPhotos,
  resizeTeamSlots,
} from "@/lib/team-slots";
import type {
  CompositionProps,
  SourceVideo,
  StudioStep,
  TeamPhoto,
} from "@/lib/types";
import type { ThumbnailMember } from "@/lib/thumbnail-template";
import {
  clearThumbnailMembers,
  emptyThumbnailMembers,
  resizeThumbnailMembers,
} from "@/lib/thumbnail-members";

type StudioContextValue = {
  step: StudioStep;
  setStep: (step: StudioStep) => void;
  video: SourceVideo | null;
  trimStart: number;
  trimEnd: number;
  photos: TeamPhoto[];
  teamMemberCount: TeamMemberCount;
  musicEnabled: boolean;
  musicVolume: number;
  videoVolume: number;
  musicTrackId: string;
  pipSide: PipSide;
  introThumbnailUrl: string | null;
  introThumbnailEnabled: boolean;
  currentTime: number;
  isPlaying: boolean;
  outputDuration: number;
  compositionProps: CompositionProps | null;
  setCurrentTime: (t: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setVideoFromFile: (file: File) => Promise<void>;
  clearVideo: () => void;
  setTrim: (edge: "start" | "end", value: number) => void;
  setTeamMemberCount: (count: TeamMemberCount) => void;
  addPhotosFromFiles: (files: FileList | File[]) => Promise<TeamPhoto[]>;
  setPhotoOnSlot: (id: string, file: File) => Promise<void>;
  /** Clear all slots, then fill from files in order (up to team size). */
  replaceTeamPhotosFromFiles: (files: FileList | File[]) => Promise<TeamPhoto[]>;
  updatePhotoMeta: (
    id: string,
    patch: Partial<Pick<TeamPhoto, "name" | "title" | "department">>,
  ) => void;
  clearPhotoSlot: (id: string) => void;
  removePhoto: (id: string) => void;
  movePhoto: (id: string, start: number) => void;
  resizePhoto: (id: string, edge: "start" | "end", value: number) => void;
  reorderPhoto: (fromId: string, toId: string) => void;
  /** Reorder teammate slots (photo cards + timeline intro order). */
  reorderTeamSlots: (fromIndex: number, toIndex: number) => void;
  autoArrange: () => void;
  resetTimeline: () => void;
  setMusicEnabled: (enabled: boolean) => void;
  setMusicVolume: (volume: number) => void;
  setVideoVolume: (volume: number) => void;
  setMusicTrackId: (id: string) => void;
  setPipSide: (side: PipSide) => void;
  setIntroThumbnail: (url: string, enabled?: boolean) => void;
  setIntroThumbnailEnabled: (enabled: boolean) => void;
  clearIntroThumbnail: () => void;
  /** Wipe video, photos, trim, music, thumbnail — full project clear. */
  resetProject: () => void;
  /** Bumps when the project is cleared so UI with local state can remount. */
  projectEpoch: number;
  /** Thumbnail builder cards — kept when switching modes so work is not lost. */
  thumbnailMembers: ThumbnailMember[];
  setThumbnailMembers: (
    next:
      | ThumbnailMember[]
      | ((prev: ThumbnailMember[]) => ThumbnailMember[]),
  ) => void;
};

function revokePhotoUrl(url: string | null) {
  if (url) URL.revokeObjectURL(url);
}

const StudioContext = createContext<StudioContextValue | null>(null);

function loadVideoMetadata(file: File): Promise<SourceVideo> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement("video");
    el.preload = "auto";
    el.muted = true;
    el.playsInline = true;
    let settled = false;

    const finish = () => {
      if (settled) return;
      const raw = el.duration;
      const durationSeconds =
        Number.isFinite(raw) && raw > 0
          ? raw
          : VIDEO_TEMPLATE.targetDurationSeconds;
      // Reject clearly broken files with no dimensions and no duration.
      if (
        (!el.videoWidth || !el.videoHeight) &&
        !(Number.isFinite(raw) && raw > 0)
      ) {
        return;
      }
      // No video track dimensions usually means HEVC/unsupported in this browser.
      if (!el.videoWidth || !el.videoHeight) {
        settled = true;
        URL.revokeObjectURL(url);
        reject(
          new Error(
            "This browser cannot display that video (often iPhone HEVC). Export or convert to an H.264 MP4, or use Record with webcam.",
          ),
        );
        return;
      }
      settled = true;
      resolve({
        url,
        fileName: file.name,
        durationSeconds,
        width: el.videoWidth || VIDEO_TEMPLATE.width,
        height: el.videoHeight || VIDEO_TEMPLATE.height,
      });
    };

    el.onloadedmetadata = () => {
      // WebM/Chrome sometimes needs a tiny seek before duration is finite.
      if (!Number.isFinite(el.duration) || el.duration === Infinity) {
        try {
          el.currentTime = Number.MAX_SAFE_INTEGER;
        } catch {
          /* ignore */
        }
      } else {
        finish();
      }
    };
    el.ondurationchange = finish;
    el.onloadeddata = finish;
    el.onseeked = finish;
    el.onerror = () => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      reject(
        new Error(
          "Could not read that video in this browser. Try another MP4 (H.264) or record with the webcam option.",
        ),
      );
    };
    window.setTimeout(() => {
      if (!settled) {
        if (el.videoWidth || (Number.isFinite(el.duration) && el.duration > 0)) {
          finish();
        } else {
          settled = true;
          URL.revokeObjectURL(url);
          reject(
            new Error(
              "Timed out reading that video. Try an H.264 MP4 file or the webcam recorder.",
            ),
          );
        }
      }
    }, 8000);
    el.src = url;
  });
}

function loadImageUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image."));
    };
    img.src = url;
  });
}

export function StudioProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<StudioStep>(1);
  const [video, setVideo] = useState<SourceVideo | null>(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState<number>(
    VIDEO_TEMPLATE.targetDurationSeconds,
  );
  const [teamMemberCount, setTeamMemberCountState] = useState<TeamMemberCount>(
    VIDEO_TEMPLATE.defaultTeamMemberCount,
  );
  const [photos, setPhotos] = useState<TeamPhoto[]>(() =>
    Array.from({ length: VIDEO_TEMPLATE.defaultTeamMemberCount }, () =>
      createEmptyTeamPhoto(),
    ),
  );
  const baselineRef = useRef<TeamPhoto[]>([]);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [musicVolume, setMusicVolume] = useState<number>(
    VIDEO_TEMPLATE.defaultMusicVolume,
  );
  const [videoVolume, setVideoVolume] = useState<number>(
    VIDEO_TEMPLATE.defaultVideoVolume,
  );
  const [musicTrackId, setMusicTrackId] = useState<string>(MUSIC_TRACKS[0].id);
  const [pipSide, setPipSide] = useState<PipSide>(
    VIDEO_TEMPLATE.pip.defaultSide,
  );
  const [introThumbnailUrl, setIntroThumbnailUrl] = useState<string | null>(
    null,
  );
  const [introThumbnailEnabled, setIntroThumbnailEnabled] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [projectEpoch, setProjectEpoch] = useState(0);
  const [thumbnailMembers, setThumbnailMembers] = useState<ThumbnailMember[]>(
    () => emptyThumbnailMembers(VIDEO_TEMPLATE.defaultTeamMemberCount),
  );

  const setIntroThumbnail = useCallback((url: string, enabled = true) => {
    setIntroThumbnailUrl((prev) => {
      if (prev && prev.startsWith("blob:") && prev !== url) {
        URL.revokeObjectURL(prev);
      }
      return url;
    });
    setIntroThumbnailEnabled(enabled);
  }, []);

  const clearIntroThumbnail = useCallback(() => {
    setIntroThumbnailUrl((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    setIntroThumbnailEnabled(false);
  }, []);

  const outputDuration = getOutputDuration(trimStart, trimEnd);

  const setTeamMemberCount = useCallback(
    (count: TeamMemberCount) => {
      setTeamMemberCountState(count);
      setPhotos((prev) => {
        const trimmed = prev.slice(count);
        trimmed.forEach((p) => revokePhotoUrl(p.url));
        const resized = resizeTeamSlots(prev, count);
        const arranged = autoArrangePhotos(resized, outputDuration);
        baselineRef.current = arranged.map((p) => ({ ...p }));
        return arranged;
      });
      setThumbnailMembers((prev) => resizeThumbnailMembers(prev, count));
    },
    [outputDuration],
  );

  const setVideoFromFile = useCallback(async (file: File) => {
    const typeOk =
      VIDEO_TEMPLATE.uploads.videoAccept.includes(file.type) ||
      /^video\//i.test(file.type) ||
      /\.(mp4|mov|webm)$/i.test(file.name);
    if (!typeOk) {
      throw new Error("Please upload an MP4, MOV, or WebM video.");
    }
    if (file.size > VIDEO_TEMPLATE.uploads.maxVideoBytes) {
      const maxGb = VIDEO_TEMPLATE.uploads.maxVideoBytes / (1024 * 1024 * 1024);
      throw new Error(
        `Video is too large. Please use a file under ${maxGb} GB, or trim/export a shorter clip first.`,
      );
    }

    const meta = await loadVideoMetadata(file);
    const end = Math.min(
      meta.durationSeconds,
      VIDEO_TEMPLATE.targetDurationSeconds,
    );
    setVideo((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return meta;
    });
    setTrimStart(0);
    setTrimEnd(end > 0 ? end : VIDEO_TEMPLATE.targetDurationSeconds);
    setCurrentTime(0);
    setIsPlaying(false);
    // Keep Step 1 roster (names, titles, headshots); only retime PIP slots.
    setPhotos((prev) => {
      const duration = end > 0 ? end : VIDEO_TEMPLATE.targetDurationSeconds;
      const arranged = autoArrangePhotos(prev, duration);
      baselineRef.current = arranged.map((p) => ({ ...p }));
      return arranged;
    });
  }, [teamMemberCount]);

  const clearVideo = useCallback(() => {
    setVideo((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
    setTrimStart(0);
    setTrimEnd(VIDEO_TEMPLATE.targetDurationSeconds);
    setCurrentTime(0);
    setIsPlaying(false);
  }, []);

  const resetProject = useCallback(() => {
    setVideo((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
    setTrimStart(0);
    setTrimEnd(VIDEO_TEMPLATE.targetDurationSeconds);
    setTeamMemberCountState(VIDEO_TEMPLATE.defaultTeamMemberCount);
    setPhotos((prev) => {
      prev.forEach((p) => revokePhotoUrl(p.url));
      const slots = Array.from(
        { length: VIDEO_TEMPLATE.defaultTeamMemberCount },
        () => createEmptyTeamPhoto(),
      );
      baselineRef.current = slots.map((p) => ({ ...p }));
      return slots;
    });
    setMusicEnabled(true);
    setMusicVolume(VIDEO_TEMPLATE.defaultMusicVolume);
    setVideoVolume(VIDEO_TEMPLATE.defaultVideoVolume);
    setMusicTrackId(MUSIC_TRACKS[0].id);
    setPipSide(VIDEO_TEMPLATE.pip.defaultSide);
    setIntroThumbnailUrl((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    setIntroThumbnailEnabled(false);
    setCurrentTime(0);
    setIsPlaying(false);
    setThumbnailMembers((prev) => {
      clearThumbnailMembers(prev);
      return emptyThumbnailMembers(VIDEO_TEMPLATE.defaultTeamMemberCount);
    });
    setStep(1);
    setProjectEpoch((n) => n + 1);
  }, []);

  const setTrim = useCallback(
    (edge: "start" | "end", value: number) => {
      if (!video) return;
      const next = trimBounds(
        trimStart,
        trimEnd,
        video.durationSeconds,
        edge,
        value,
      );
      setTrimStart(next.trimStart);
      setTrimEnd(next.trimEnd);
      const duration = getOutputDuration(next.trimStart, next.trimEnd);
      setPhotos((photosNow) =>
        photosNow.map((p) => {
          if (p.startSeconds + p.durationSeconds <= duration) return p;
          const start = Math.min(p.startSeconds, Math.max(0, duration - 1));
          return {
            ...p,
            startSeconds: start,
            durationSeconds: Math.max(1, duration - start),
          };
        }),
      );
      setCurrentTime((t) => Math.min(t, duration));
    },
    [video, trimStart, trimEnd],
  );

  const setPhotoOnSlot = useCallback(
    async (id: string, file: File) => {
      const typeOk =
        VIDEO_TEMPLATE.uploads.photoAccept.includes(file.type) ||
        /\.(jpe?g|png|webp)$/i.test(file.name);
      if (!typeOk) {
        throw new Error("Please upload a JPG, PNG, or WebP headshot.");
      }
      if (file.size > VIDEO_TEMPLATE.uploads.maxPhotoBytes) {
        throw new Error("That photo is too large. Please use a smaller image.");
      }
      const url = await loadImageUrl(file);
      const guessed = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
      setPhotos((prev) => {
        const next = prev.map((p) => {
          if (p.id !== id) return p;
          revokePhotoUrl(p.url);
          return {
            ...p,
            url,
            fileName: file.name,
            name: p.name || guessed,
          };
        });
        const arranged = autoArrangePhotos(next, outputDuration);
        baselineRef.current = arranged.map((p) => ({ ...p }));
        return arranged;
      });
    },
    [outputDuration],
  );

  const prepareImageFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    const prepared: Array<{ file: File; url: string }> = [];
    for (const file of list) {
      const typeOk =
        VIDEO_TEMPLATE.uploads.photoAccept.includes(file.type) ||
        /\.(jpe?g|png|webp)$/i.test(file.name);
      if (!typeOk) continue;
      if (file.size > VIDEO_TEMPLATE.uploads.maxPhotoBytes) continue;
      prepared.push({ file, url: await loadImageUrl(file) });
    }
    return prepared;
  };

  const addPhotosFromFiles = useCallback(
    async (files: FileList | File[]) => {
      const prepared = await prepareImageFiles(files);
      if (prepared.length === 0) {
        throw new Error("Please upload JPG, PNG, or WebP images.");
      }

      let arrangedResult: TeamPhoto[] = [];
      setPhotos((prev) => {
        const next = prev.map((p) => ({ ...p }));
        let pi = 0;
        for (let i = 0; i < next.length && pi < prepared.length; i += 1) {
          if (next[i].url) continue;
          const { file, url } = prepared[pi];
          pi += 1;
          const guessed = file.name
            .replace(/\.[^.]+$/, "")
            .replace(/[-_]/g, " ");
          revokePhotoUrl(next[i].url);
          next[i] = {
            ...next[i],
            url,
            fileName: file.name,
            name: next[i].name || guessed,
          };
        }
        while (pi < prepared.length) {
          URL.revokeObjectURL(prepared[pi].url);
          pi += 1;
        }
        arrangedResult = autoArrangePhotos(next, outputDuration);
        baselineRef.current = arrangedResult.map((p) => ({ ...p }));
        return arrangedResult;
      });
      return arrangedResult;
    },
    [outputDuration],
  );

  const replaceTeamPhotosFromFiles = useCallback(
    async (files: FileList | File[]) => {
      const prepared = await prepareImageFiles(files);
      if (prepared.length === 0) {
        throw new Error("Please upload JPG, PNG, or WebP images.");
      }

      let arrangedResult: TeamPhoto[] = [];
      setPhotos((prev) => {
        prev.forEach((p) => revokePhotoUrl(p.url));
        const next = Array.from({ length: teamMemberCount }, (_, i) => {
          const slot = createEmptyTeamPhoto();
          if (i >= prepared.length) return slot;
          const { file, url } = prepared[i];
          const guessed = file.name
            .replace(/\.[^.]+$/, "")
            .replace(/[-_]/g, " ");
          return {
            ...slot,
            url,
            fileName: file.name,
            name: guessed,
          };
        });
        // Revoke extras not used
        for (let i = teamMemberCount; i < prepared.length; i += 1) {
          URL.revokeObjectURL(prepared[i].url);
        }
        arrangedResult = autoArrangePhotos(next, outputDuration);
        baselineRef.current = arrangedResult.map((p) => ({ ...p }));
        return arrangedResult;
      });
      return arrangedResult;
    },
    [outputDuration, teamMemberCount],
  );

  const updatePhotoMeta = useCallback(
    (
      id: string,
      patch: Partial<Pick<TeamPhoto, "name" | "title" | "department">>,
    ) => {
      setPhotos((prev) => {
        const index = prev.findIndex((p) => p.id === id);
        if (index >= 0) {
          queueMicrotask(() => {
            setThumbnailMembers((thumbs) =>
              thumbs.map((t, i) =>
                i === index
                  ? {
                      ...t,
                      name: patch.name !== undefined ? patch.name : t.name,
                      title: patch.title !== undefined ? patch.title : t.title,
                    }
                  : t,
              ),
            );
          });
        }
        return prev.map((p) => (p.id === id ? { ...p, ...patch } : p));
      });
      baselineRef.current = baselineRef.current.map((p) =>
        p.id === id ? { ...p, ...patch } : p,
      );
    },
    [],
  );

  const clearPhotoSlot = useCallback(
    (id: string) => {
      setPhotos((prev) => {
        const next = prev.map((p) => {
          if (p.id !== id) return p;
          revokePhotoUrl(p.url);
          return {
            ...p,
            url: null,
            fileName: "",
          };
        });
        const arranged = autoArrangePhotos(next, outputDuration);
        baselineRef.current = arranged.map((p) => ({ ...p }));
        return arranged;
      });
    },
    [outputDuration],
  );

  const removePhoto = useCallback(
    (id: string) => {
      clearPhotoSlot(id);
    },
    [clearPhotoSlot],
  );

  const movePhoto = useCallback(
    (id: string, start: number) => {
      setPhotos((prev) => movePhotoBlock(prev, id, start, outputDuration));
    },
    [outputDuration],
  );

  const resizePhoto = useCallback(
    (id: string, edge: "start" | "end", value: number) => {
      setPhotos((prev) =>
        edge === "start"
          ? resizePhotoStart(prev, id, value, outputDuration)
          : resizePhotoEnd(prev, id, value, outputDuration),
      );
    },
    [outputDuration],
  );

  const reorderPhoto = useCallback(
    (fromId: string, toId: string) => {
      setPhotos((prev) => reorderPhotos(prev, fromId, toId, outputDuration));
    },
    [outputDuration],
  );

  const reorderTeamSlots = useCallback(
    (fromIndex: number, toIndex: number) => {
      setPhotos((prev) => {
        if (
          fromIndex === toIndex ||
          fromIndex < 0 ||
          toIndex < 0 ||
          fromIndex >= prev.length ||
          toIndex >= prev.length
        ) {
          return prev;
        }
        const next = [...prev];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        const arranged = autoArrangePhotos(next, outputDuration);
        baselineRef.current = arranged.map((p) => ({ ...p }));
        return arranged;
      });
    },
    [outputDuration],
  );

  const autoArrange = useCallback(() => {
    setPhotos((prev) => {
      const arranged = autoArrangePhotos(prev, outputDuration);
      baselineRef.current = arranged.map((p) => ({ ...p }));
      return arranged;
    });
  }, [outputDuration]);

  const resetTimeline = useCallback(() => {
    if (baselineRef.current.length === 0) {
      autoArrange();
      return;
    }
    setPhotos(baselineRef.current.map((p) => ({ ...p })));
  }, [autoArrange]);

  const compositionProps = useMemo<CompositionProps | null>(() => {
    if (!video) return null;
    const track = MUSIC_TRACKS.find((t) => t.id === musicTrackId) ?? MUSIC_TRACKS[0];
    return {
      videoSrc: video.url,
      trimStartSeconds: trimStart,
      durationInSeconds: outputDuration,
      photos: filledTeamPhotos(photos).map((p) => ({
        id: p.id,
        src: p.url,
        name: p.name,
        title: p.title,
        department: p.department,
        startSeconds: p.startSeconds,
        durationSeconds: p.durationSeconds,
      })),
      pipSide,
      introThumbnailSrc: introThumbnailEnabled ? introThumbnailUrl : null,
      introThumbnailEnabled,
      videoVolume,
      musicSrc: musicEnabled ? track.src : null,
      musicVolume,
      musicEnabled,
    };
  }, [
    video,
    trimStart,
    outputDuration,
    photos,
    musicEnabled,
    musicVolume,
    videoVolume,
    musicTrackId,
    pipSide,
    introThumbnailUrl,
    introThumbnailEnabled,
  ]);

  const value = useMemo<StudioContextValue>(
    () => ({
      step,
      setStep,
      video,
      trimStart,
      trimEnd,
      photos,
      teamMemberCount,
      musicEnabled,
      musicVolume,
      videoVolume,
      musicTrackId,
      pipSide,
      introThumbnailUrl,
      introThumbnailEnabled,
      currentTime,
      isPlaying,
      outputDuration,
      compositionProps,
      setCurrentTime,
      setIsPlaying,
      setVideoFromFile,
      clearVideo,
      setTrim,
      setTeamMemberCount,
      addPhotosFromFiles,
      setPhotoOnSlot,
      replaceTeamPhotosFromFiles,
      updatePhotoMeta,
      clearPhotoSlot,
      removePhoto,
      movePhoto,
      resizePhoto,
      reorderPhoto,
      reorderTeamSlots,
      autoArrange,
      resetTimeline,
      setMusicEnabled,
      setMusicVolume,
      setVideoVolume,
      setMusicTrackId,
      setPipSide,
      setIntroThumbnail,
      setIntroThumbnailEnabled,
      clearIntroThumbnail,
      resetProject,
      projectEpoch,
      thumbnailMembers,
      setThumbnailMembers,
    }),
    [
      step,
      video,
      trimStart,
      trimEnd,
      photos,
      teamMemberCount,
      musicEnabled,
      musicVolume,
      videoVolume,
      musicTrackId,
      pipSide,
      introThumbnailUrl,
      introThumbnailEnabled,
      currentTime,
      isPlaying,
      outputDuration,
      compositionProps,
      projectEpoch,
      thumbnailMembers,
      setTeamMemberCount,
      setPhotoOnSlot,
      replaceTeamPhotosFromFiles,
      clearPhotoSlot,
      setIntroThumbnail,
      clearIntroThumbnail,
      setVideoFromFile,
      clearVideo,
      setTrim,
      addPhotosFromFiles,
      updatePhotoMeta,
      removePhoto,
      movePhoto,
      resizePhoto,
      reorderPhoto,
      reorderTeamSlots,
      autoArrange,
      resetTimeline,
      resetProject,
    ],
  );

  return (
    <StudioContext.Provider value={value}>{children}</StudioContext.Provider>
  );
}

export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error("useStudio must be used within StudioProvider");
  return ctx;
}
