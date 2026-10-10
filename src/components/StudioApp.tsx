"use client";

import { useEffect } from "react";
import { StudioProvider, useStudio } from "@/lib/studio-context";
import { StepIndicator } from "@/components/StepIndicator";
import { HelpTip } from "@/components/HelpTip";
import { StartOverButton } from "@/components/StartOverButton";
import { VideoUploadStep } from "@/components/steps/VideoUploadStep";
import { PreviewExportStep } from "@/components/steps/PreviewExportStep";

function StudioShell() {
  const { step, setStep } = useStudio();

  // After webcam/upload, Continue sits at the bottom of a long Step 1 — jump
  // to the top so Step 2 (and Back / workflow jumps) open at the page start.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [step]);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#f3f1ea_0%,#ebe8df_55%,#e4e0d6_100%)]" />
        <div className="absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(ellipse_at_top,#ffe566_0%,transparent_62%)] opacity-55" />
      </div>

      <header className="border-b border-[var(--ink)] bg-[var(--yellow)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 md:px-6">
          <div className="animate-fade-up flex items-center gap-3 md:gap-3.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/loves-video-mascot.jpg"
              alt="Love's Video Studio mascot"
              className="h-14 w-14 rounded-[var(--radius-md)] border border-[var(--ink)] bg-white object-cover md:h-16 md:w-16"
              width={1024}
              height={1024}
            />
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/loves-logo.png"
                alt="Love's"
                className="h-8 w-auto md:h-9"
                width={194}
                height={50}
              />
              <p className="font-hero mt-0.5 text-[1.75rem] leading-none md:text-[2.1rem]">
                Video Studio
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-start justify-end">
            <HelpTip title="What is this tool?" size="lg">
              <p>
                This tool helps Love&apos;s sales reps make a short video for
                customers — without needing to be techy.
              </p>
              <p>
                You record yourself (or upload a clip). If you want teammate
                photos in the corner or a team thumbnail cover, have a
                professional-looking headshot ready for each person — including
                yourself for the thumbnail.
              </p>
              <p>
                Then trim, add quiet music if you want, and download an MP4 to
                share.
              </p>
              <p>Tap any ? button anytime for help.</p>
            </HelpTip>
          </div>
        </div>

        {step === 1 ? (
          <div className="border-t border-black/15 px-4 py-3 md:px-6">
            <div className="mx-auto max-w-6xl space-y-1.5 text-[15px] font-semibold leading-snug text-[var(--ink)] md:text-[16px]">
              <p>
                Make a short video for your customers the easy way. You talk on
                camera — and if you want, we&apos;ll put teammate photos in the
                corner and build a Love&apos;s Team thumbnail for you too.
              </p>
              <p className="text-[14px] font-medium text-[var(--ink)]/80 md:text-[15px]">
                Tip: If you want a thumbnail cover and/or corner photos, gather
                a professional-looking headshot of each teammate first — and one
                of yourself if you&apos;ll appear on the thumbnail.
              </p>
            </div>
          </div>
        ) : null}

        <div className="border-t border-black/20 bg-[var(--olive)]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90 md:px-6 md:text-xs">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>Fleet Sales</span>
              <span className="hidden text-white/35 sm:inline">|</span>
              <span className="hidden sm:inline">Team intros</span>
              <span className="hidden text-white/35 md:inline">|</span>
              <span className="hidden md:inline">MP4 export</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-[var(--radius-sm)] border border-white/25 bg-[var(--primary)] px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] md:text-[11px]">
                Enterprise studio
              </span>
              <StartOverButton />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 md:px-6 md:py-7">
        <div className="mb-5">
          <StepIndicator step={step} onChange={setStep} />
        </div>
        <section className="studio-panel animate-rise p-4 md:p-7">
          {step === 1 ? <VideoUploadStep /> : null}
          {step === 2 ? (
            <PreviewExportStep onEditThumbnail={() => setStep(1)} />
          ) : null}
        </section>
      </main>

      <footer className="mt-2 border-t border-[var(--ink)] bg-[var(--olive)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 text-white md:px-6">
          <p className="text-[13px] font-semibold tracking-tight">
            Love&apos;s Video Studio · Fleet team introductions
          </p>
          <p className="text-[12px] font-medium text-white/70">
            Short · Clear · On-brand
          </p>
        </div>
      </footer>
    </div>
  );
}

export function StudioApp() {
  return (
    <StudioProvider>
      <StudioShell />
    </StudioProvider>
  );
}
