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

const CONTENT_TIPS = [
  "Smile and greet the customer like you would on a friendly call.",
  "Say your name and role at Love’s in the first few seconds.",
  "Introduce each teammate by name and what they help customers with — match the order of the photos you will upload.",
  "Keep the whole message near 60 seconds. One clear idea beats a long speech.",
  "End with how customers can reach the team or what happens next.",
  "You do not need a script word-for-word. Bullet notes on paper next to the camera are fine.",
  "If you stumble, pause and start that sentence again — you can trim mistakes later.",
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
  const [contentOpen, setContentOpen] = useState(true);
  const baseId = useId();

  const active = DEVICES.find((d) => d.id === openDevice) ?? null;

  return (
    <section
      aria-labelledby={`${baseId}-heading`}
      className="rounded-3xl border-2 border-[var(--ink)] bg-white p-4 md:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2">
            <Video className="h-7 w-7 text-[var(--primary)]" aria-hidden />
            <h3
              id={`${baseId}-heading`}
              className="font-display text-3xl tracking-wide text-[var(--ink)] md:text-4xl"
            >
              How to record your video
            </h3>
          </div>
          <p className="mt-2 text-lg text-[var(--muted)] md:text-xl">
            New to this? Tap the device you will use. We will walk you through
            camera, lighting, sound, and what to say.
          </p>
        </div>
        <HelpTip title="Recording help" size="lg">
          <p>
            You can record on a computer camera, iPhone, Android phone, or a
            separate camera.
          </p>
          <p>
            After you record, bring the file into Step 1 with Choose video file.
          </p>
          <p>Scroll down for tips on what to say in your ~60 second intro.</p>
        </HelpTip>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                "flex min-h-[7.5rem] flex-col items-start gap-2 rounded-2xl border-2 px-4 py-4 text-left transition focus-visible:outline focus-visible:outline-4 focus-visible:outline-[var(--yellow)]",
                selected
                  ? "border-[var(--ink)] bg-[var(--yellow)]"
                  : "border-[var(--ink)] bg-[var(--panel-soft)] hover:bg-[var(--yellow)]/50",
              )}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--primary)] text-white">
                {device.icon}
              </span>
              <span className="text-lg font-bold leading-tight text-[var(--ink)]">
                {device.shortLabel}
              </span>
              <span className="text-base text-[var(--muted)]">
                {selected ? "Tap to hide tips" : "Tap for setup tips"}
              </span>
            </button>
          );
        })}
      </div>

      {active ? (
        <div
          id={`${baseId}-${active.id}`}
          className="mt-4 space-y-5 rounded-2xl border-2 border-[var(--ink)] bg-[var(--panel-soft)] p-4 md:p-5"
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

      <div className="mt-5 rounded-2xl border-2 border-[var(--ink)] bg-[var(--yellow)]/40">
        <button
          type="button"
          aria-expanded={contentOpen}
          onClick={() => setContentOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left focus-visible:outline focus-visible:outline-4 focus-visible:outline-[var(--yellow)]"
        >
          <span>
            <span className="block text-xl font-bold text-[var(--ink)] md:text-2xl">
              What to say in your video
            </span>
            <span className="mt-1 block text-base text-[var(--muted)] md:text-lg">
              Tap to {contentOpen ? "hide" : "show"} a simple outline anyone can
              follow
            </span>
          </span>
          <ChevronDown
            className={clsx(
              "h-7 w-7 shrink-0 text-[var(--ink)] transition",
              contentOpen && "rotate-180",
            )}
          />
        </button>
        {contentOpen ? (
          <div className="border-t-2 border-[var(--ink)] bg-white px-4 py-4 md:px-5">
            <p className="text-lg font-medium leading-relaxed text-[var(--ink)]">
              Think of this as a friendly handshake on video. Keep it near{" "}
              <strong>60 seconds</strong>.
            </p>
            <ol className="mt-4 list-decimal space-y-3 pl-6 text-base leading-relaxed text-[var(--ink)] md:text-lg">
              <li>
                <strong>Hello + who you are.</strong> Name, role, and that you
                are with Love&apos;s.
              </li>
              <li>
                <strong>Why you are reaching out.</strong> One sentence about
                how your team helps this customer.
              </li>
              <li>
                <strong>Meet the team.</strong> Introduce each person while
                their photo is on screen (name + what they do).
              </li>
              <li>
                <strong>Close clearly.</strong> Thank them and say how to
                follow up (or that more details are in the Allego sales room).
              </li>
            </ol>
            <TipList heading="Extra tips" items={CONTENT_TIPS} />
            <div className="mt-4 rounded-xl border-2 border-[var(--ink)] bg-[var(--panel-soft)] px-4 py-3 text-base leading-relaxed text-[var(--ink)] md:text-lg">
              <strong>Example opener:</strong> “Hi, I&apos;m Alex with Love&apos;s
              Fleet Sales. I wanted to quickly introduce our team that will
              support your account…”
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
