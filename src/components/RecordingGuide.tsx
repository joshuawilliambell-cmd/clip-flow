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

type DeviceId = "webcam" | "iphone" | "android" | "standalone";

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
    title: "Computer webcam & microphone",
    shortLabel: "Computer camera",
    icon: <Laptop className="h-6 w-6" aria-hidden />,
    summary:
      "Best if you are already at a desk laptop or desktop. Use the built-in camera, or a USB webcam, plus your computer microphone (or a headset).",
    camera: [
      "Sit so the camera is at eye level (stack books under a laptop if needed).",
      "Frame yourself from about mid-chest up. Leave a little space above your head.",
      "Look into the camera lens when you speak, not at your own face on screen.",
      "Leave a little empty space on one side of the frame — teammate photos will appear in a top corner (you choose left or right in the tool).",
      "Close extra apps so your computer runs smoothly while recording.",
    ],
    lighting: [
      "Face a window or a lamp. Put the light in front of you, not behind you.",
      "Avoid bright windows behind your head (that makes your face dark).",
      "Turn on a soft desk lamp if the room is dim.",
      "Wear something that contrasts with your background so you stand out.",
    ],
    audio: [
      "Record in a quiet room. Close the door and pause fans or music.",
      "A headset or earbuds with a mic often sound clearer than a laptop mic.",
      "Keep the mic about a hand’s length from your mouth if using a headset.",
      "Do a 5-second test recording and play it back before the real take.",
    ],
    recordSteps: [
      "Open your computer’s Camera app (Windows) or Photo Booth / QuickTime (Mac).",
      "Or use Teams / Zoom local recording if that is how your team usually records.",
      "Record in landscape (wide) if your app gives you a choice — not tall/portrait.",
      "Speak for about 45–70 seconds. You can trim later in this tool.",
      "Save the file as MP4 or MOV when you are done.",
    ],
    getIntoTool: [
      "Easiest: in Step 1, use Option B — Record with this computer’s webcam — to record right in this tool.",
      "Or record in Camera / QuickTime, then in Step 1 tap Choose video from folder and select the file.",
      "Watch the preview, then trim with the red timeline handles if needed.",
    ],
  },
  {
    id: "iphone",
    title: "iPhone",
    shortLabel: "iPhone",
    icon: <Smartphone className="h-6 w-6" aria-hidden />,
    summary:
      "Great picture quality. Hold the phone sideways (landscape) and prop it up so it does not shake.",
    camera: [
      "Turn the phone sideways (landscape). Do not record tall/portrait.",
      "Use the back camera for sharper video (or front camera if you need to see yourself).",
      "Prop the phone on a stack of books, a mug, or a small tripod at eye level.",
      "Clean the lens with a soft cloth.",
      "Stand or sit so you fill the frame from mid-chest up, with a little space above your head.",
      "Leave empty space on one side of the frame when you can — teammate photos will sit in a top corner (left or right).",
    ],
    lighting: [
      "Face a window or bright indoor light.",
      "Do not stand with a bright window or lamp right behind you.",
      "Turn on a lamp in front of you if the room looks dim on screen.",
    ],
    audio: [
      "Find a quiet spot. Silence notifications (Focus / Do Not Disturb).",
      "Stay within a few feet of the phone so your voice is clear.",
      "If windy outdoors, step inside — wind noise is hard to fix later.",
      "Record a short test, play it back, then do your real take.",
    ],
    recordSteps: [
      "Open the Camera app → choose Video.",
      "Rotate the phone to landscape.",
      "Tap the red record button. Speak your intro. Tap stop when finished.",
      "Aim for about one minute. It is OK if you go a little long — you can trim here.",
    ],
    getIntoTool: [
      "AirDrop the video to your computer, or email / text it to yourself, or save to Files / OneDrive / Google Drive.",
      "On your computer, open this Love’s Video Studio page.",
      "In Step 1, tap Choose video file and pick the iPhone video (MOV or MP4).",
      "If you are on the iPhone browser, you can try uploading from Photos — a computer upload is often easier for the next editing steps.",
    ],
  },
  {
    id: "android",
    title: "Android phone",
    shortLabel: "Android",
    icon: <Smartphone className="h-6 w-6" aria-hidden />,
    summary:
      "Same idea as iPhone: landscape video, steady phone, good front light, quiet room.",
    camera: [
      "Turn the phone sideways (landscape).",
      "Open the Camera app and choose Video.",
      "Prop the phone at eye level so it does not shake.",
      "Use the rear camera for sharper video when you can.",
      "Frame mid-chest up. Leave a little room above your head.",
      "Keep some empty space on the right for teammate photos in the finished video.",
    ],
    lighting: [
      "Face a window or lamp — light in front of you.",
      "Avoid bright light behind you.",
      "Check the preview screen: if your face looks dark, move the light or turn toward a brighter area.",
    ],
    audio: [
      "Turn on Do Not Disturb so calls and texts do not interrupt.",
      "Record indoors if it is windy outside.",
      "Speak clearly a few feet from the phone.",
      "Do a short test clip and listen before the real recording.",
    ],
    recordSteps: [
      "Open Camera → Video → hold phone sideways.",
      "Tap record, say your intro (~60 seconds), tap stop.",
      "Save or keep the clip in Photos / Gallery.",
    ],
    getIntoTool: [
      "Send the file to your computer (email, USB cable, Google Drive, OneDrive, or Nearby Share).",
      "On your computer, open Love’s Video Studio → Step 1 → Choose video file.",
      "Select the Android video (usually MP4).",
      "Trim with the red handles if the clip is longer than you need.",
    ],
  },
  {
    id: "standalone",
    title: "Standalone camera",
    shortLabel: "Separate camera",
    icon: <Camera className="h-6 w-6" aria-hidden />,
    summary:
      "Use a camcorder, DSLR, mirrorless camera, or Action camera if that is what you have. Keep it simple: tripod, eye level, and a quiet room.",
    camera: [
      "Put the camera on a tripod or stable surface at eye level.",
      "Record in landscape 16:9 if your camera has that option (1080p is ideal).",
      "Focus on your face. Use autofocus if you are unsure.",
      "Frame mid-chest up with a little space above your head.",
      "Leave room on one side of the frame for teammate photos later (you pick left or right in the tool).",
    ],
    lighting: [
      "Face soft light (window or lamp).",
      "Turn off harsh overhead lights that cast dark eye shadows if you can.",
      "Do a quick picture check on the camera screen before you speak.",
    ],
    audio: [
      "Use an external mic if you have one (lavalier or camera shotgun mic).",
      "If using the built-in mic, stay close and keep the room quiet.",
      "Watch for air conditioner, fridge, and hallway noise.",
      "Record 5 seconds of silence first so you can check levels, then start talking.",
    ],
    recordSteps: [
      "Set the camera to movie / video mode.",
      "Press record, wait one second, then start speaking.",
      "Keep the take around one minute.",
      "Press stop and wait for the file to finish saving before removing the card.",
    ],
    getIntoTool: [
      "Copy the video file to your computer with a card reader, cable, or camera software.",
      "Prefer MP4 or MOV files.",
      "In Step 1, tap Choose video file and select the recording.",
      "Trim the start/end in this tool so the finished video is about 60 seconds.",
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
  const [openDevice, setOpenDevice] = useState<DeviceId | null>(null);
  const [contentOpen, setContentOpen] = useState(false);
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
              Recording tips
            </h3>
          </div>
          <p className="mt-1 text-[14px] font-medium text-[var(--muted)]">
            Optional — tap a device for setup help, or expand what to say.
          </p>
        </div>
        <HelpTip title="Recording help" size="lg">
          <p>
            Record on a computer camera, iPhone, Android, or separate camera,
            then upload the file in Step 1.
          </p>
          <p>Landscape, eye-level, front light, quiet room works best.</p>
        </HelpTip>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
                {device.shortLabel}
              </span>
            </button>
          );
        })}
      </div>

      {active ? (
        <div
          id={`${baseId}-${active.id}`}
          className="mt-4 space-y-5 section-card bg-[var(--panel-soft)] p-4 md:p-5"
        >
          <div>
            <h4 className="text-2xl font-bold text-[var(--ink)]">
              {active.title}
            </h4>
            <p className="mt-2 text-lg leading-relaxed text-[var(--ink)]">
              {active.summary}
            </p>
          </div>
          <TipList heading="Camera setup" items={active.camera} />
          <TipList heading="Lighting" items={active.lighting} />
          <TipList heading="Audio / microphone" items={active.audio} />
          <TipList heading="How to record" items={active.recordSteps} />
          <TipList
            heading="How to get the video into this tool"
            items={active.getIntoTool}
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setOpenDevice(null)}
          >
            Close these tips
          </button>
        </div>
      ) : null}

      <div className="mt-3 section-card bg-[var(--panel-soft)]">
        <button
          type="button"
          aria-expanded={contentOpen}
          onClick={() => setContentOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--olive)]"
        >
          <span className="text-[15px] font-semibold tracking-tight text-[var(--ink)]">
            What to say (~60s outline)
          </span>
          <ChevronDown
            className={clsx(
              "h-5 w-5 shrink-0 text-[var(--ink)] transition",
              contentOpen && "rotate-180",
            )}
          />
        </button>
        {contentOpen ? (
          <div className="border-t border-[var(--hairline)] bg-white px-4 py-3.5">
            <ol className="list-decimal space-y-2 pl-5 text-[14px] leading-relaxed text-[var(--ink)]">
              <li>
                <strong>Hello</strong> — name, role, Love&apos;s.
              </li>
              <li>
                <strong>Why you&apos;re reaching out</strong> — one sentence.
              </li>
              <li>
                <strong>Meet the team</strong> — name + role as each photo
                shows.
              </li>
              <li>
                <strong>Close</strong> — thank them; point to Allego for details.
              </li>
            </ol>
            <p className="mt-3 rounded-[var(--radius-md)] border border-[var(--hairline)] bg-[var(--panel-soft)] px-3 py-2.5 text-[13px] leading-relaxed text-[var(--ink)]">
              <strong>Example:</strong> “Hi, I&apos;m Alex with Love&apos;s Fleet
              Sales. I wanted to quickly introduce our team that will support
              your account…”
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
