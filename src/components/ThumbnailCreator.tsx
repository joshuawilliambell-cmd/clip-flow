"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, ImagePlus, Trash2, Wand2 } from "lucide-react";
import { v4 as uuid } from "uuid";
import { HelpTip } from "@/components/HelpTip";
import {
  exportTeamThumbnailPng,
  renderTeamThumbnail,
} from "@/lib/render-thumbnail";
import {
  THUMBNAIL_TEMPLATE,
  type ThumbnailMember,
} from "@/lib/thumbnail-template";

function emptyMembers(count = 4): ThumbnailMember[] {
  return Array.from({ length: count }, () => ({
    id: uuid(),
    photoUrl: null,
    name: "",
    title: "",
  }));
}

export function ThumbnailCreator() {
  const [members, setMembers] = useState<ThumbnailMember[]>(() => emptyMembers(4));
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRefs = useRef<Array<HTMLInputElement | null>>([]);

  const filledCount = useMemo(
    () => members.filter((m) => m.photoUrl || m.name.trim() || m.title.trim()).length,
    [members],
  );

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const active = members.filter(
            (m) => m.photoUrl || m.name.trim() || m.title.trim(),
          );
          const canvas = await renderTeamThumbnail(
            active.length > 0 ? active : members.slice(0, 4),
          );
          if (cancelled) return;
          const url = canvas.toDataURL("image/png");
          setPreviewUrl((prev) => {
            if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
            return url;
          });
        } catch (e) {
          if (!cancelled) {
            setError(
              e instanceof Error ? e.message : "Could not update thumbnail preview.",
            );
          }
        }
      })();
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [members]);

  const updateMember = (id: string, patch: Partial<ThumbnailMember>) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const onPickPhoto = async (id: string, file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
      setError("Please upload a JPG, PNG, or WebP headshot.");
      return;
    }
    const url = URL.createObjectURL(file);
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        if (m.photoUrl) URL.revokeObjectURL(m.photoUrl);
        const guessed = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
        return {
          ...m,
          photoUrl: url,
          name: m.name || guessed,
        };
      }),
    );
  };

  const clearPhoto = (id: string) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        if (m.photoUrl) URL.revokeObjectURL(m.photoUrl);
        return { ...m, photoUrl: null };
      }),
    );
  };

  const loadPractice = async () => {
    setBusy(true);
    setError(null);
    try {
      const samples = [
        { path: "/samples/team-jared.jpg", name: "Jared Thueson", title: "Total Truck Care" },
        {
          path: "/samples/team-bailey.jpg",
          name: "Bailey Ledbetter",
          title: "Area Account Manager",
        },
        { path: "/samples/team-jared.jpg", name: "Josh Bell", title: "Regional Account Manager" },
        {
          path: "/samples/team-teresa.jpg",
          name: "Teresa Walker",
          title: "Fleet Account Specialist",
        },
      ];
      const next: ThumbnailMember[] = [];
      for (const sample of samples) {
        const res = await fetch(sample.path);
        if (!res.ok) throw new Error("Practice photos are missing.");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        next.push({
          id: uuid(),
          photoUrl: url,
          name: sample.name,
          title: sample.title,
        });
      }
      setMembers((prev) => {
        prev.forEach((m) => {
          if (m.photoUrl) URL.revokeObjectURL(m.photoUrl);
        });
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load practice team.");
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    setBusy(true);
    setError(null);
    try {
      const active = members.filter(
        (m) => m.photoUrl || m.name.trim() || m.title.trim(),
      );
      if (active.length === 0) {
        throw new Error("Add at least one teammate photo or name first.");
      }
      const blob = await exportTeamThumbnailPng(active);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "loves-team-thumbnail.png";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not download thumbnail.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <h2 className="font-display text-4xl tracking-wide text-[var(--ink)] md:text-5xl">
            Create a Love&apos;s Team thumbnail
          </h2>
          <p className="mt-3 text-lg text-[var(--muted)] md:text-xl">
            Upload up to four headshots and type each person&apos;s name and job
            title. The navy-and-gold frame stays the same — you only add the
            people.
          </p>
        </div>
        <HelpTip title="Thumbnail help" size="lg">
          <p>
            This makes a shareable team image for Allego or email — matching the
            Love&apos;s Team template.
          </p>
          <p>
            <strong>1.</strong> Tap each card and choose a headshot photo.
          </p>
          <p>
            <strong>2.</strong> Type the name and job title under each photo.
          </p>
          <p>
            <strong>3.</strong> Check the live preview, then tap Download
            thumbnail PNG.
          </p>
          <p>You can fill 1 to 4 people. Empty slots are left out of the final image.</p>
        </HelpTip>
      </div>

      <div className="how-banner">
        Tip: Use clear, well-lit head-and-shoulders photos. Names and titles
        should be short so they stay easy to read.
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void loadPractice()}
          disabled={busy}
          className="btn-yellow"
        >
          <Wand2 className="h-5 w-5" />
          {busy ? "Loading…" : "Load practice team"}
        </button>
        <button
          type="button"
          onClick={() => {
            setMembers((prev) => {
              prev.forEach((m) => {
                if (m.photoUrl) URL.revokeObjectURL(m.photoUrl);
              });
              return emptyMembers(4);
            });
          }}
          className="btn-secondary"
        >
          Clear all
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {members.map((member, index) => (
          <article
            key={member.id}
            className="rounded-2xl border-2 border-[var(--ink)] bg-white p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-lg font-bold text-[var(--ink)]">
                Teammate {index + 1}
              </p>
              <HelpTip title={`Teammate ${index + 1}`}>
                <p>Upload a headshot, then type their name and job title.</p>
                <p>Leave a card empty if you have fewer than four people.</p>
              </HelpTip>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => fileRefs.current[index]?.click()}
                className="relative h-36 w-28 shrink-0 overflow-hidden rounded-xl border-2 border-[var(--ink)] bg-[#eef1f6]"
              >
                {member.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.photoUrl}
                    alt=""
                    className="h-full w-full object-cover object-[center_28%]"
                  />
                ) : (
                  <span className="flex h-full flex-col items-center justify-center gap-2 px-2 text-center text-sm font-semibold text-[var(--ink)]">
                    <ImagePlus className="h-6 w-6 text-[var(--primary)]" />
                    Add headshot
                  </span>
                )}
              </button>
              <input
                ref={(el) => {
                  fileRefs.current[index] = el;
                }}
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => {
                  void onPickPhoto(member.id, e.target.files?.[0]);
                  e.currentTarget.value = "";
                }}
              />

              <div className="min-w-0 flex-1 space-y-3">
                <label className="block">
                  <span className="field-label">Name</span>
                  <input
                    className="field-input"
                    value={member.name}
                    placeholder="Example: Jared Thueson"
                    onChange={(e) =>
                      updateMember(member.id, { name: e.target.value })
                    }
                  />
                </label>
                <label className="block">
                  <span className="field-label">Job title</span>
                  <input
                    className="field-input"
                    value={member.title}
                    placeholder="Example: Total Truck Care"
                    onChange={(e) =>
                      updateMember(member.id, { title: e.target.value })
                    }
                  />
                </label>
                {member.photoUrl ? (
                  <button
                    type="button"
                    onClick={() => clearPhoto(member.id)}
                    className="inline-flex items-center gap-2 text-base font-semibold text-[var(--primary)]"
                  >
                    <Trash2 className="h-4 w-4" /> Remove photo
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>

      <section className="rounded-2xl border-2 border-[var(--ink)] bg-white p-4 md:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-2xl font-bold text-[var(--ink)]">
              Live thumbnail preview
            </h3>
            <p className="text-base text-[var(--muted)]">
              Stock Love&apos;s Team frame · {filledCount || 0} of{" "}
              {THUMBNAIL_TEMPLATE.maxMembers} people filled · exports at{" "}
              {THUMBNAIL_TEMPLATE.width}×{THUMBNAIL_TEMPLATE.height}
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void download()}
            className="btn-primary"
          >
            <Download className="h-5 w-5" />
            {busy ? "Working…" : "Download thumbnail PNG"}
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border-2 border-[var(--ink)] bg-[#f4f5f7]">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Love's Team thumbnail preview"
              className="w-full"
            />
          ) : (
            <div className="flex aspect-video items-center justify-center text-lg text-[var(--muted)]">
              Preview will appear here
            </div>
          )}
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border-2 border-[var(--primary)] bg-red-50 px-4 py-3 text-lg font-medium text-[var(--primary-dark)]">
            {error}
          </p>
        ) : null}

        <p className="mt-4 text-base text-[var(--muted)] md:text-lg">
          Use this PNG as your Allego video thumbnail or sales-room image. The
          decorative corners and &quot;Love&apos;s Team&quot; header are fixed in
          the template.
        </p>
      </section>
    </div>
  );
}
