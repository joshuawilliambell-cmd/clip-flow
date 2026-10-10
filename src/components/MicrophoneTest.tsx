"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { HelpTip } from "@/components/HelpTip";
import { PanelSteps } from "@/components/PanelStep";
import {
  isLikelyEmbeddedPreview,
  probeMicrophone,
  resumeAudioContext,
} from "@/lib/mic-access";

/**
 * In-app mic check so users can see if the browser hears them before
 * Follow My Voice or webcam recording.
 */
export function MicrophoneTest() {
  const baseId = useId();
  const [testing, setTesting] = useState(false);
  const [level, setLevel] = useState(0);
  const [deviceLabel, setDeviceLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [heardOnce, setHeardOnce] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef(0);

  const stop = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void ctxRef.current?.close();
    ctxRef.current = null;
    setTesting(false);
    setLevel(0);
  };

  useEffect(() => () => stop(), []);

  const start = async () => {
    setError(null);
    setHeardOnce(false);
    stop();

    const probe = await probeMicrophone();
    if (!probe.ok) {
      setError(probe.message);
      return;
    }

    streamRef.current = probe.stream;
    setDeviceLabel(
      probe.deviceCount > 0
        ? `${probe.deviceLabel} (${probe.deviceCount} input${probe.deviceCount === 1 ? "" : "s"} found)`
        : probe.deviceLabel,
    );

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioCtx();
      ctxRef.current = ctx;
      await resumeAudioContext(ctx);
      const source = ctx.createMediaStreamSource(probe.stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const data = new Uint8Array(analyser.fftSize);

      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        const next = Math.min(1, rms * 4);
        setLevel(next);
        if (next > 0.04) setHeardOnce(true);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      setTesting(true);
    } catch {
      probe.stream.getTracks().forEach((t) => t.stop());
      setError(
        "Could not read microphone levels. Try Chrome or Edge on your computer.",
      );
    }
  };

  const embedded = isLikelyEmbeddedPreview();
  const percent = Math.round(level * 100);

  return (
    <section
      aria-labelledby={`${baseId}-heading`}
      className="section-card space-y-3 bg-white p-4 md:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Mic
            className="mt-0.5 h-5 w-5 shrink-0 text-[var(--primary)]"
            aria-hidden
          />
          <div>
            <h3
              id={`${baseId}-heading`}
              className="text-lg font-semibold tracking-tight text-[var(--ink)]"
            >
              Test Your Microphone
            </h3>
          </div>
        </div>
        <HelpTip title="Test Your Microphone">
          <p>
            System sound settings can hear your mic even when Cursor’s preview
            cannot. This test uses the same browser access as Follow My Voice
            and webcam recording.
          </p>
        </HelpTip>
      </div>

      {embedded ? (
        <div className="how-banner">
          <strong>Important:</strong> You appear to be in Cursor’s in-app
          preview. That preview usually <strong>cannot</strong> hear your
          computer microphone (even when the mic works in system settings).
          Open{" "}
          <a
            className="font-bold underline"
            href="https://clip-flow-green.vercel.app"
            target="_blank"
            rel="noreferrer"
          >
            https://clip-flow-green.vercel.app
          </a>{" "}
          in <strong>Chrome or Edge</strong> on your computer, then run this
          test again.
        </div>
      ) : (
        <div className="how-banner">
          Click the button below, allow Microphone when asked, then speak. The
          yellow bar should jump when you talk.
        </div>
      )}

      <PanelSteps
        steps={[
          <>
            Open this studio in <strong>Chrome or Edge</strong> on your computer
            (not only inside Cursor).
          </>,
          <>
            Click <strong>Click Here to Test Microphone</strong> and choose{" "}
            <strong>Allow</strong>.
          </>,
          <>
            Speak — if the meter moves, Follow My Voice and webcam audio can use
            this mic.
          </>,
        ]}
      />

      <div className="flex flex-wrap items-center gap-3">
        {!testing ? (
          <button type="button" onClick={() => void start()} className="btn-primary">
            <Mic className="h-5 w-5" />
            Click Here to Test Microphone
          </button>
        ) : (
          <button type="button" onClick={stop} className="btn-secondary">
            <MicOff className="h-5 w-5" />
            Click Here to Stop Mic Test
          </button>
        )}
      </div>

      {testing ? (
        <div className="space-y-2 rounded-[var(--radius-md)] border border-[var(--ink)] bg-[var(--panel-soft)] p-3">
          <p className="text-[13px] font-medium text-[var(--ink)]">
            Listening on: <strong>{deviceLabel ?? "Microphone"}</strong>
          </p>
          <div
            className="h-4 overflow-hidden rounded-full bg-white"
            role="meter"
            aria-label="Microphone level"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <div
              className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-75"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-[13px] font-medium text-[var(--muted)]">
            {heardOnce
              ? "Mic is working — the browser can hear you."
              : "Speak now… if the bar stays flat, the browser is not getting audio from this mic."}
          </p>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-[var(--radius-sm)] border border-[var(--primary)] bg-red-50 px-3 py-2 text-[14px] font-medium text-[var(--primary-dark)]">
          {error}
        </p>
      ) : null}
    </section>
  );
}
