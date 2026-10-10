"use client";

import { useId, useState } from "react";
import { clsx } from "clsx";
import {
  Camera,
  ChevronDown,
  Laptop,
  Smartphone,
  Video,
} from "lucide-react";
import { HelpTip } from "@/components/HelpTip";
import { PanelSteps } from "@/components/PanelStep";

type DeviceId = "webcam" | "phone" | "standalone";

type DeviceGuide = {
  id: DeviceId;
  title: string;
  shortLabel: string;
  icon: React.ReactNode;
  summary: string;
  camera: string[];
  lighting: string[];
  audio: string[];
  recordSteps: string[];
  getIntoTool: string[];
};

const DEVICES: DeviceGuide[] = [
  {
    id: "webcam",
    title: "Computer Webcam & Microphone",
    shortLabel: "Computer Camera",
    icon: <Laptop className="h-6 w-6" aria-hidden />,
    summary:
      "For a computer only. Record in this studio with your webcam and on-screen teleprompter — easiest way to read your script and look at the lens. No Teams or Zoom needed.",
    camera: [
      "Sit so the webcam is at eye level.",
      "Scoot back so we see from about your waist up to the top of your head.",
      "Look toward the webcam lens when you speak.",
      "Leave a little empty space on one side for teammate photos later.",
    ],
    lighting: [
      "Face a window or lamp — light in front of you, not behind you.",
      "Avoid bright windows behind your head.",
    ],
    audio: [
      "Record in a quiet room.",
      "A headset mic often sounds clearer than a laptop mic.",
    ],
    recordSteps: [
      "On a computer, under Record With Webcam, click Start Webcam.",
      "Allow the computer camera and microphone when the browser asks.",
      "Step 1: click Follow My Voice, then read out loud so the script scrolls with you.",
      "Step 2: click Start Recording for the real take; use Pause or Stop as needed.",
    ],
    getIntoTool: [
      "Your webcam recording loads into the studio when you finish.",
      "Only use Upload A Saved Video if you already recorded somewhere else.",
    ],
  },
  {
    id: "phone",
    title: "Phone Camera",
    shortLabel: "Phone Camera",
    icon: <Smartphone className="h-6 w-6" aria-hidden />,
    summary:
      "Two options: (1) open this studio on your phone and record with the on-screen teleprompter, or (2) use the phone Camera app, then upload the file. Match Video Format (landscape 16:9 or portrait 4:3).",
    camera: [
      "Match Video Format: sideways for landscape 16:9, upright for portrait 4:3.",
      "Prop the phone at eye level so it does not shake.",
      "Frame from about waist up to the top of your head.",
      "In this studio on your phone: selfie camera opens first — tap Flip for rear.",
    ],
    lighting: [
      "Face a window or bright indoor light.",
      "Do not stand with a bright window behind you.",
    ],
    audio: [
      "Silence notifications.",
      "Stay close enough that your voice is clear.",
      "If you use Follow My Voice in Safari/Chrome on the phone, allow the microphone.",
    ],
    recordSteps: [
      "Option A — this studio on your phone: Start Webcam → Follow My Voice → Start Recording (Pause/Stop at the bottom).",
      "Option B — Camera app: choose Video, record in the matching shape, then stop.",
    ],
    getIntoTool: [
      "Option A: the recording loads into the studio when you save it.",
      "Option B: send the file to your computer (AirDrop, email, Drive), then Choose Video From File in Step 1.",
    ],
  },
  {
    id: "standalone",
    title: "Separate Camera",
    shortLabel: "Separate Camera",
    icon: <Camera className="h-6 w-6" aria-hidden />,
    summary:
      "Use a camcorder or DSLR on a tripod at eye level in a quiet room.",
    camera: [
      "Tripod at eye level; match Video Format (16:9 landscape or 4:3 portrait).",
      "Frame mid-chest or waist up with a little space above your head.",
    ],
    lighting: ["Face soft light (window or lamp)."],
    audio: [
      "Use an external mic if you have one.",
      "Keep the room quiet.",
    ],
    recordSteps: [
      "Set movie mode, press record, wait one second, then speak.",
      "Press stop and wait for the file to finish saving.",
    ],
    getIntoTool: [
      "Copy the file to your computer.",
      "In Step 1, click Choose Video From File.",
    ],
  },
];

function TipList({
  heading,
  items,
}: {
  heading: string;
  items: string[];
}) {
  return (
    <div>
      <h4 className="text-lg font-bold text-[var(--ink)]">{heading}</h4>
      <ul className="mt-2 list-disc space-y-2 pl-6 text-base leading-relaxed text-[var(--ink)] md:text-lg">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function RecordingGuide() {
  const [expanded, setExpanded] = useState(false);
  const [openDevice, setOpenDevice] = useState<DeviceId | null>(null);
  const baseId = useId();

  const active = DEVICES.find((d) => d.id === openDevice) ?? null;

  return (
    <section
      aria-labelledby={`${baseId}-heading`}
      className="section-card bg-white p-4 md:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-[var(--primary)]" aria-hidden />
            <h3
              id={`${baseId}-heading`}
              className="font-display text-xl tracking-tight text-[var(--ink)] md:text-2xl"
            >
              Recording Tips
            </h3>
          </div>
        </div>
        <HelpTip title="Recording Tips" size="lg">
          <p>
            Optional setup help. The easiest path is{" "}
            <strong>Record With Webcam</strong> with Follow My Voice on the
            teleprompter.
          </p>
        </HelpTip>
      </div>

      <div className="how-banner mt-3">
        On a computer, use <strong>Computer Webcam</strong> tips + Record With
        Webcam below. On a phone, open <strong>Phone Camera</strong> tips (studio
        on phone, or Camera app then upload).
      </div>

      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
        className="btn-secondary mt-3"
      >
        <ChevronDown
          className={clsx("h-5 w-5 transition", expanded && "rotate-180")}
        />
        {expanded
          ? "Click Here to Hide Recording Tips"
          : "Click Here for Recording Tips"}
      </button>

      {expanded ? (
        <div className="mt-4 space-y-4">
          <PanelSteps
            steps={[
              <>
                On a computer, choose <strong>Computer Webcam</strong> — webcam +
                teleprompter + Follow My Voice.
              </>,
              <>
                On a phone, choose <strong>Phone Camera</strong> for phone-specific
                steps (studio on phone or Camera app).
              </>,
              <>
                Then record with <strong>Record With Webcam</strong> below, or
                upload a file from your phone Camera app.
              </>,
            ]}
          />

          <div className="grid gap-2 sm:grid-cols-3">
            {DEVICES.map((device) => {
              const selected = openDevice === device.id;
              const panelId = `${baseId}-${device.id}`;
              return (
                <button
                  key={device.id}
                  type="button"
                  aria-expanded={selected}
                  aria-controls={panelId}
                  onClick={() =>
                    setOpenDevice((current) =>
                      current === device.id ? null : device.id,
                    )
                  }
                  className={clsx(
                    "flex min-h-[4.25rem] items-center gap-3 rounded-[var(--radius-md)] border px-3 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--olive)]",
                    selected
                      ? "border-[var(--ink)] bg-[var(--yellow)]"
                      : "border-[var(--hairline)] bg-[var(--panel-soft)] hover:border-[var(--ink)]",
                  )}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary)] text-white">
                    {device.icon}
                  </span>
                  <span className="text-[14px] font-semibold leading-tight text-[var(--ink)]">
                    Click Here for {device.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>

          {active ? (
            <div
              id={`${baseId}-${active.id}`}
              className="space-y-5 section-card bg-[var(--panel-soft)] p-4 md:p-5"
            >
              <div>
                <h4 className="text-2xl font-bold text-[var(--ink)]">
                  {active.title}
                </h4>
                <p className="mt-2 text-lg leading-relaxed text-[var(--ink)]">
                  {active.summary}
                </p>
              </div>
              <TipList heading="Camera Setup" items={active.camera} />
              <TipList heading="Lighting" items={active.lighting} />
              <TipList heading="Audio / Microphone" items={active.audio} />
              <TipList heading="How To Record" items={active.recordSteps} />
              <TipList
                heading="How To Get The Video Into This Tool"
                items={active.getIntoTool}
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setOpenDevice(null)}
              >
                Click Here to Close These Tips
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
