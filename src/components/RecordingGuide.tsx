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
      "Recommended. Record in this studio with the webcam and on-screen teleprompter — easiest way to read your script and look at the camera. No Teams or Zoom needed.",
    camera: [
      "Sit so the camera is at eye level.",
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
      "Under Record With Webcam, click Start Webcam.",
      "Allow camera and microphone when the browser asks.",
      "Step 1: click Follow My Voice, then read out loud so the script scrolls with you.",
      "Step 2: click Start Recording for the real take, and keep reading the same way.",
    ],
    getIntoTool: [
      "Your recording loads into the studio when you finish.",
      "Only use Upload A Saved Video if you already recorded somewhere else.",
    ],
  },
  {
    id: "phone",
    title: "Phone Camera",
    shortLabel: "Phone Camera",
    icon: <Smartphone className="h-6 w-6" aria-hidden />,
    summary:
      "Optional path. Webcam + teleprompter in this studio is usually easier. If you use a phone: match the Video Format you picked (landscape or portrait), prop it steady, face the light, and record in a quiet room.",
    camera: [
      "Match Video Format: sideways for landscape, upright for portrait.",
      "Prop it at eye level so it does not shake.",
      "Frame from about waist up to the top of your head.",
    ],
    lighting: [
      "Face a window or bright indoor light.",
      "Do not stand with a bright window behind you.",
    ],
    audio: [
      "Silence notifications.",
      "Stay close enough that your voice is clear.",
    ],
    recordSteps: [
      "Open the Camera app and choose Video.",
      "Record in the same shape as Video Format, then stop when finished.",
    ],
    getIntoTool: [
      "Send the file to your computer (AirDrop, email, Drive, etc.).",
      "In Step 1, click Choose Video From File and pick the clip.",
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
      "Tripod at eye level; match Video Format (16:9 landscape or 9:16 portrait).",
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
        Recommended: record with the <strong>webcam and teleprompter</strong>{" "}
        in this studio. Open tips below only if you need camera, light, or sound
        advice.
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
                Prefer <strong>Computer Webcam</strong> — it works with the
                teleprompter and Follow My Voice.
              </>,
              <>Read the setup tips for camera, light, and sound.</>,
              <>
                Then go to <strong>Record With Webcam</strong> below.
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
