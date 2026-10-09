"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { scriptWords } from "@/lib/teleprompter-layout";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

function getSpeechRecognitionCtor():
  | (new () => SpeechRecognitionLike)
  | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Optional practice mode: listen with the browser Speech API and scroll
 * the teleprompter as spoken words match the script. Chrome/Edge work best.
 */
export function useTeleprompterVoiceFollow(
  script: string,
  scrollerRef: React.RefObject<HTMLDivElement | null>,
) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [matchedWords, setMatchedWords] = useState(0);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const wordIndexRef = useRef(0);
  const wordsRef = useRef<string[]>([]);
  const wantListenRef = useRef(false);

  useEffect(() => {
    setSupported(Boolean(getSpeechRecognitionCtor()));
  }, []);

  useEffect(() => {
    wordsRef.current = scriptWords(script);
    wordIndexRef.current = 0;
    setMatchedWords(0);
  }, [script]);

  const scrollToProgress = useCallback(
    (wordIndex: number, total: number) => {
      const el = scrollerRef.current;
      if (!el || total <= 0) return;
      const maxScroll = el.scrollHeight - el.clientHeight;
      if (maxScroll <= 0) return;
      // Keep a little lead so the next line sits near the reading guide.
      const progress = Math.min(1, Math.max(0, (wordIndex + 2) / total));
      el.scrollTop = progress * maxScroll;
    },
    [scrollerRef],
  );

  const stop = useCallback(() => {
    wantListenRef.current = false;
    setListening(false);
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    if (rec) {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.stop();
      } catch {
        /* already stopped */
      }
    }
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setStatus(
        "Voice follow needs Chrome or Edge (browser speech recognition).",
      );
      return;
    }
    stop();
    wantListenRef.current = true;
    wordIndexRef.current = 0;
    setMatchedWords(0);
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;

    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    recognitionRef.current = rec;

    rec.onresult = (event) => {
      let chunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        chunk += ` ${event.results[i][0].transcript}`;
      }
      const heard = scriptWords(chunk);
      if (heard.length === 0) return;

      const words = wordsRef.current;
      let idx = wordIndexRef.current;
      for (const token of heard) {
        // Look ahead a few words so filler (“um”, mishears) does not stall.
        const windowEnd = Math.min(words.length, idx + 6);
        let hit = -1;
        for (let i = idx; i < windowEnd; i++) {
          if (words[i] === token || words[i]?.startsWith(token) || token.startsWith(words[i] ?? "")) {
            hit = i;
            break;
          }
        }
        if (hit >= 0) {
          idx = hit + 1;
        }
      }
      if (idx !== wordIndexRef.current) {
        wordIndexRef.current = idx;
        setMatchedWords(idx);
        scrollToProgress(idx, words.length);
      }
      if (idx >= words.length) {
        setStatus("You reached the end of the script. Nice work.");
        stop();
      }
    };

    rec.onerror = (event) => {
      if (event.error === "not-allowed") {
        setStatus(
          "Microphone blocked or unavailable. Allow mic access in your browser (Chrome/Edge on your computer). Cursor’s preview often has no mic — open the site in a normal browser tab instead.",
        );
      } else if (event.error === "audio-capture") {
        setStatus(
          "No microphone found. Plug one in, or open this site in Chrome/Edge on your computer (not an embedded preview).",
        );
      } else if (event.error === "no-speech") {
        setStatus("No speech heard yet — keep reading.");
        return;
      } else if (event.error !== "aborted") {
        setStatus("Voice follow paused. Click again to retry.");
      }
      wantListenRef.current = false;
      setListening(false);
    };

    rec.onend = () => {
      if (wantListenRef.current) {
        try {
          rec.start();
          return;
        } catch {
          /* fall through */
        }
      }
      setListening(false);
    };

    try {
      rec.start();
      setListening(true);
      setStatus(
        "Listening… read out loud. The script scrolls as it hears your words.",
      );
    } catch {
      setStatus(
        "Could not start the microphone. Use Chrome or Edge on your computer with mic permission allowed — Cursor’s in-app preview usually cannot access a mic.",
      );
      wantListenRef.current = false;
      setListening(false);
    }
  }, [scrollToProgress, scrollerRef, stop]);

  useEffect(() => () => stop(), [stop]);

  const totalWords = scriptWords(script).length;

  return {
    supported,
    listening,
    status,
    matchedWords,
    totalWords,
    start,
    stop,
    toggle: () => (listening ? stop() : start()),
  };
}
