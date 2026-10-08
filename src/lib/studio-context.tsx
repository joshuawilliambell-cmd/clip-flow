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
import { v4 as uuid } from "uuid";
import { MUSIC_TRACKS, VIDEO_TEMPLATE } from "@/lib/template";
import {
  autoArrangePhotos,
  getOutputDuration,
  movePhotoBlock,
  reorderPhotos,
  resizePhotoEnd,
  resizePhotoStart,
  trimBounds,
} from "@/lib/timeline";
import type {
  CompositionProps,
  SourceVideo,
  StudioStep,
  TeamPhoto,
} from "@/lib/types";

type StudioContextValue = {
  step: StudioStep;
  setStep: (step: StudioStep) => void;
  video: SourceVideo | null;
  trimStart: number;
  trimEnd: number;
  photos: TeamPhoto[];
  musicEnabled: boolean;
  musicVolume: number;
  videoVolume: number;
  musicTrackId: string;
  currentTime: number;
  isPlaying: boolean;
  outputDuration: number;
  compositionProps: CompositionProps | null;
  setCurrentTime: (t: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setVideoFromFile: (file: File) => Promise<void>;
  clearVideo: () => void;
  setTrim: (edge: "start" | "end", value: number) => void;
  addPhotosFromFiles: (files: FileList | File[]) => Promise<TeamPhoto[]>;
  updatePhotoMeta: (
    id: string,
    patch: Partial<Pick<TeamPhoto, "name" | "title" | "department">>,
  ) => void;
  removePhoto: (id: string) => void;
  movePhoto: (id: string, start: number) => void;
  resizePhoto: (id: string, edge: "start" | "end", value: number) => void;
  reorderPhoto: (fromId: string, toId: string) => void;
  autoArrange: () => void;
  resetTimeline: () => void;
  setMusicEnabled: (enabled: boolean) => void;
  setMusicVolume: (volume: number) => void;
  setVideoVolume: (volume: number) => void;
  setMusicTrackId: (id: string) => void;
};

const StudioContext = createContext<StudioContextValue | null>(null);

function loadVideoMetadata(file: File): Promise<SourceVideo> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement("video");
    el.preload = "auto";
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
  const [photos, setPhotos] = useState<TeamPhoto[]>([]);
  const baselineRef = useRef<TeamPhoto[]>([]);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [musicVolume, setMusicVolume] = useState<number>(
    VIDEO_TEMPLATE.defaultMusicVolume,
  );
  const [videoVolume, setVideoVolume] = useState<number>(
    VIDEO_TEMPLATE.defaultVideoVolume,
  );
  const [musicTrackId, setMusicTrackId] = useState<string>(MUSIC_TRACKS[0].id);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const outputDuration = getOutputDuration(trimStart, trimEnd);

  const setVideoFromFile = useCallback(async (file: File) => {
    const typeOk =
      VIDEO_TEMPLATE.uploads.videoAccept.includes(file.type) ||
      /^video\//i.test(file.type) ||
      /\.(mp4|mov|webm)$/i.test(file.name);
    if (!typeOk) {
      throw new Error("Please upload an MP4, MOV, or WebM video.");
    }
    if (file.size > VIDEO_TEMPLATE.uploads.maxVideoBytes) {
      throw new Error("Video is too large. Please use a file under 500 MB.");
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
    setPhotos((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      baselineRef.current = [];
      return [];
    });
  }, []);

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

  const addPhotosFromFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      const remaining = VIDEO_TEMPLATE.maxPhotos - photos.length;
      if (remaining <= 0) {
        throw new Error(
          `You can add up to ${VIDEO_TEMPLATE.maxPhotos} team photos.`,
        );
      }

      const accepted = list.slice(0, remaining);
      const created: TeamPhoto[] = [];

      for (const file of accepted) {
        const typeOk =
          VIDEO_TEMPLATE.uploads.photoAccept.includes(file.type) ||
          /\.(jpe?g|png|webp)$/i.test(file.name);
        if (!typeOk) continue;
        if (file.size > VIDEO_TEMPLATE.uploads.maxPhotoBytes) continue;
        const url = await loadImageUrl(file);
        created.push({
          id: uuid(),
          url,
          fileName: file.name,
          name: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
          title: "",
          department: "",
          startSeconds: 0,
          durationSeconds: VIDEO_TEMPLATE.defaultPhotoDurationSeconds,
        });
      }

      if (created.length === 0) {
        throw new Error("Please upload JPG, PNG, or WebP images.");
      }

      let arrangedResult: TeamPhoto[] = [];
      setPhotos((prev) => {
        const merged = [...prev, ...created];
        arrangedResult = autoArrangePhotos(merged, outputDuration);
        baselineRef.current = arrangedResult.map((p) => ({ ...p }));
        return arrangedResult;
      });
      return arrangedResult;
    },
    [photos.length, outputDuration],
  );

  const updatePhotoMeta = useCallback(
    (
      id: string,
      patch: Partial<Pick<TeamPhoto, "name" | "title" | "department">>,
    ) => {
      setPhotos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      );
      baselineRef.current = baselineRef.current.map((p) =>
        p.id === id ? { ...p, ...patch } : p,
      );
    },
    [],
  );

  const removePhoto = useCallback((id: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.id !== id);
    });
    baselineRef.current = baselineRef.current.filter((p) => p.id !== id);
  }, []);

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
      photos: photos.map((p) => ({
        id: p.id,
        src: p.url,
        name: p.name,
        title: p.title,
        department: p.department,
        startSeconds: p.startSeconds,
        durationSeconds: p.durationSeconds,
      })),
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
  ]);

  const value = useMemo<StudioContextValue>(
    () => ({
      step,
      setStep,
      video,
      trimStart,
      trimEnd,
      photos,
      musicEnabled,
      musicVolume,
      videoVolume,
      musicTrackId,
      currentTime,
      isPlaying,
      outputDuration,
      compositionProps,
      setCurrentTime,
      setIsPlaying,
      setVideoFromFile,
      clearVideo,
      setTrim,
      addPhotosFromFiles,
      updatePhotoMeta,
      removePhoto,
      movePhoto,
      resizePhoto,
      reorderPhoto,
      autoArrange,
      resetTimeline,
      setMusicEnabled,
      setMusicVolume,
      setVideoVolume,
      setMusicTrackId,
    }),
    [
      step,
      video,
      trimStart,
      trimEnd,
      photos,
      musicEnabled,
      musicVolume,
      videoVolume,
      musicTrackId,
      currentTime,
      isPlaying,
      outputDuration,
      compositionProps,
      setVideoFromFile,
      clearVideo,
      setTrim,
      addPhotosFromFiles,
      updatePhotoMeta,
      removePhoto,
      movePhoto,
      resizePhoto,
      reorderPhoto,
      autoArrange,
      resetTimeline,
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
