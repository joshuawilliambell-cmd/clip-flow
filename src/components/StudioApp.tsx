"use client";

import { StudioProvider, useStudio } from "@/lib/studio-context";
import { StepIndicator } from "@/components/StepIndicator";
import { HelpTip } from "@/components/HelpTip";
import { VideoUploadStep } from "@/components/steps/VideoUploadStep";
import { TeamPhotosStep } from "@/components/steps/TeamPhotosStep";
import { PreviewExportStep } from "@/components/steps/PreviewExportStep";

function StudioShell() {
  const { step, setStep } = useStudio();

  return (
    <div className="relative min-h-screen bg-white">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#fffdf2_0%,#ffffff_45%,#fff7f7_100%)]" />
        <div className="absolute left-0 right-0 top-0 h-2 bg-[var(--primary)]" />
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-[var(--yellow)]" />
      </div>

      <header className="border-b-2 border-[var(--ink)] bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-6">
          <div className="animate-fade-up flex items-center gap-3">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] shadow-sm"
              aria-hidden
            >
              <svg viewBox="0 0 24 24" className="h-8 w-8 fill-white" aria-hidden>
                <path d="M12 21s-6.7-4.35-9.33-8.1C.7 9.9 2.1 6 5.6 6c1.9 0 3.1 1.05 3.9 2.2C10.3 7.05 11.5 6 13.4 6c3.5 0 4.9 3.9 2.93 6.9C18.7 16.65 12 21 12 21z" />
              </svg>
            </div>
            <div>
              <p className="font-display text-4xl font-bold leading-none tracking-wide text-[var(--primary)] md:text-5xl">
                Love&apos;s
              </p>
              <p className="mt-1 text-base font-bold uppercase tracking-[0.18em] text-[var(--ink)]">
                Video Studio
              </p>
            </div>
          </div>

          <div className="flex max-w-md items-start gap-2">
            <p className="text-right text-base font-medium leading-snug text-[var(--ink)] md:text-lg">
              Make a short team video in 3 easy steps. No video editing skills
              needed.
            </p>
            <HelpTip title="What is this tool?" size="lg">
              <p>
                This app helps you make a about 60-second introduction video for
                customers.
              </p>
              <p>
                <strong>Step 1:</strong> Add your talking video.
              </p>
              <p>
                <strong>Step 2:</strong> Add photos of your team.
              </p>
              <p>
                <strong>Step 3:</strong> Choose music, check the preview, then
                export an MP4 file.
              </p>
              <p>Tap any yellow ? button anytime for help.</p>
            </HelpTip>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
        <div className="animate-fade-up-delay mb-6">
          <StepIndicator step={step} onChange={setStep} />
        </div>

        <section className="animate-rise rounded-3xl border-2 border-[var(--ink)] bg-white p-4 shadow-[0_12px_0_rgba(0,0,0,0.06)] md:p-8">
          {step === 1 ? <VideoUploadStep /> : null}
          {step === 2 ? <TeamPhotosStep /> : null}
          {step === 3 ? <PreviewExportStep /> : null}
        </section>
      </main>
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
