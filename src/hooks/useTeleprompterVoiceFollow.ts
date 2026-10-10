"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { scriptWords } from "@/lib/teleprompter-layout";
import { probeMicrophone } from "@/lib/mic-access";
import { advanceVoiceFollowIndex } from "@/lib/voice-follow-match";

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
  /** Script index when the current recognition phrase began (for interim re-align). */
  const phraseStartIndexRef = useRef(0);
  const lastResultIndexRef = useRef(0);

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
      // Slight lead so the reading line stays ahead of the voice.
      const progress = Math.min(1, Math.max(0, (wordIndex + 1) / total));
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
    phraseStartIndexRef.current = 0;
    lastResultIndexRef.current = 0;
    setMatchedWords(0);
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
    setStatus("Asking for microphone access…");

    void (async () => {
      // Unlock permission first — SpeechRecognition alone often fails silently
      // in embedded previews and some browsers without a prior getUserMedia.
      const probe = await probeMicrophone();
      if (!wantListenRef.current) return;
      if (!probe.ok) {
        setStatus(probe.message);
        wantListenRef.current = false;
        setListening(false);
        return;
      }
      // Release the probe stream so SpeechRecognition can own the mic.
      probe.stream.getTracks().forEach((t) => t.stop());

      const rec = new Ctor();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";
      recognitionRef.current = rec;

      rec.onresult = (event) => {
        // New phrase slot — lock the script index so interim re-aligns cleanly.
        if (event.resultIndex > lastResultIndexRef.current) {
          phraseStartIndexRef.current = wordIndexRef.current;
          lastResultIndexRef.current = event.resultIndex;
        }

        // Full transcript for this phrase (finals + growing interim).
        let chunk = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (!result) continue;
          chunk += ` ${result[0].transcript}`;
        }
        const heard = scriptWords(chunk);
        if (heard.length === 0) return;

        const words = wordsRef.current;
        // Re-run from phrase start every time so ASR corrections keep pace
        // instead of getting stuck on a stale partial match.
        const idx = advanceVoiceFollowIndex(
          words,
          phraseStartIndexRef.current,
          heard,
        );
        // Never move backward within a live phrase.
        const next = Math.max(wordIndexRef.current, idx);
        if (next !== wordIndexRef.current) {
          wordIndexRef.current = next;
          setMatchedWords(next);
          scrollToProgress(next, words.length);
        }
        if (next >= words.length) {
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
          `Listening on ${probe.deviceLabel}… read out loud. The script scrolls as it hears your words.`,
        );
      } catch {
        setStatus(
          "Could not start the microphone. Use Chrome or Edge on your computer with mic permission allowed — Cursor’s in-app preview usually cannot access a mic.",
        );
        wantListenRef.current = false;
        setListening(false);
      }
    })();
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
