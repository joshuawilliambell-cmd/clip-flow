"use client";

import { StudioProvider, useStudio } from "@/lib/studio-context";
import { StepIndicator } from "@/components/StepIndicator";
import { VideoUploadStep } from "@/components/steps/VideoUploadStep";
import { TeamPhotosStep } from "@/components/steps/TeamPhotosStep";
import { PreviewExportStep } from "@/components/steps/PreviewExportStep";

function StudioShell() {
  const { step, setStep } = useStudio();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(200,16,46,0.18),transparent_42%),radial-gradient(circle_at_88%_0%,rgba(245,183,0,0.16),transparent_36%),linear-gradient(165deg,#f4efe8_0%,#efe7dc_45%,#e7eef5_100%)]" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231a1a1a' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <header className="border-b border-black/5 bg-white/50 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div className="animate-fade-up">
            <p className="font-display text-3xl font-bold tracking-[0.04em] text-[var(--primary)] md:text-4xl">
              Love&apos;s
            </p>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--ink)]">
              Video Studio
            </p>
          </div>
          <p className="max-w-xs text-right text-xs text-[var(--muted)] md:text-sm">
            Create a branded ~60s customer introduction for Allego — upload,
            time your team photos, generate.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
        <div className="animate-fade-up-delay mb-8">
          <StepIndicator step={step} onChange={setStep} />
        </div>

        <section className="animate-rise rounded-[1.75rem] border border-white/70 bg-white/75 p-4 shadow-[0_30px_80px_rgba(40,20,20,0.08)] backdrop-blur md:p-8">
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
