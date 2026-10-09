"use client";

import { clsx } from "clsx";
import {
  TELEPROMPTER_COLUMN_CLASS,
  TELEPROMPTER_TEXT_CLASS_COMPACT,
  TELEPROMPTER_TEXT_CLASS_LARGE,
} from "@/lib/teleprompter-layout";
import { tokenizeScript } from "@/lib/teleprompter-script-view";

type TeleprompterHighlightedScriptProps = {
  script: string;
  /** Words already spoken / current reading position (exclusive end). */
  highlightThrough: number;
  fontLarge: boolean;
  /** Extra roomy line spacing (Teleprompter.com-style). */
  roomyLines: boolean;
  className?: string;
  emptyLabel?: string;
};

/**
 * Renders script with the current word highlighted — matches the
 * “highlight every word as you say it” pattern from Teleprompter Premium+.
 */
export function TeleprompterHighlightedScript({
  script,
  highlightThrough,
  fontLarge,
  roomyLines,
  className,
  emptyLabel = "Add a script above, then click Play / Scroll to practice.",
}: TeleprompterHighlightedScriptProps) {
  const text = script.trim();
  if (!text) {
    return (
      <div
        className={clsx(
          "mx-auto text-white/70",
          TELEPROMPTER_COLUMN_CLASS,
          fontLarge
            ? TELEPROMPTER_TEXT_CLASS_LARGE
            : TELEPROMPTER_TEXT_CLASS_COMPACT,
          roomyLines && "leading-relaxed",
          className,
        )}
      >
        {emptyLabel}
      </div>
    );
  }

  const tokens = tokenizeScript(text);
  const current = Math.max(0, highlightThrough - 1);

  return (
    <div
      className={clsx(
        "mx-auto whitespace-pre-wrap text-white",
        TELEPROMPTER_COLUMN_CLASS,
        fontLarge
          ? TELEPROMPTER_TEXT_CLASS_LARGE
          : TELEPROMPTER_TEXT_CLASS_COMPACT,
        roomyLines && "!leading-relaxed",
        className,
      )}
    >
      {tokens.map((token, i) => {
        if (token.type === "gap") {
          return <span key={`g-${i}`}>{token.text}</span>;
        }
        const spoken = token.wordIndex < highlightThrough;
        const isCurrent = token.wordIndex === current && highlightThrough > 0;
        return (
          <span
            key={`w-${token.wordIndex}`}
            className={clsx(
              spoken && !isCurrent && "text-white/45",
              isCurrent &&
                "rounded-sm bg-[var(--yellow)] px-0.5 text-[var(--ink)]",
            )}
          >
            {token.text}
          </span>
        );
      })}
    </div>
  );
}
