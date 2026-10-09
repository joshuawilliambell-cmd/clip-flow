"use client";

import { StudioProvider, useStudio } from "@/lib/studio-context";
import { StepIndicator } from "@/components/StepIndicator";
import { HelpTip } from "@/components/HelpTip";
import { PurposeGuide } from "@/components/PurposeGuide";
import { StartOverButton } from "@/components/StartOverButton";
import { VideoUploadStep } from "@/components/steps/VideoUploadStep";
import { PreviewExportStep } from "@/components/steps/PreviewExportStep";

function StudioShell() {
  const { step, setStep } = useStudio();

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

          <div className="flex max-w-md items-start gap-2">
            <p className="text-right text-[13px] font-semibold leading-snug tracking-tight text-[var(--ink)] md:text-[14px]">
              Allego team intros &amp; thumbnails
            </p>
            <HelpTip title="What is this tool?" size="lg">
              <p>
                This tool helps Love&apos;s employees introduce their team to
                customers.
              </p>
              <p>
                In Step 1, add teammates, optionally build a Love&apos;s Team
                thumbnail opener, then record or upload your talking video.
              </p>
              <p>Tap any ? button anytime for help.</p>
            </HelpTip>
          </div>
        </div>

        <div className="border-t border-black/20 bg-[var(--olive)]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90 md:px-6 md:text-xs">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>Fleet Sales</span>
              <span className="hidden text-white/35 sm:inline">|</span>
              <span className="hidden sm:inline">Team intros</span>
              <span className="hidden text-white/35 md:inline">|</span>
              <span className="hidden md:inline">Allego ready</span>
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
        <div className="animate-fade-up-delay">
          <PurposeGuide />
        </div>
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
            Love&apos;s Video Studio · Allego digital sales rooms
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
