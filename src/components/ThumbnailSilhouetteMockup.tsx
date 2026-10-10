import { clsx } from "clsx";
import { TeamPhotoSilhouette } from "@/components/TeamPhotoSilhouette";

/**
 * Tiny 4-person Love's Team thumbnail mockup for plain-language help.
 */
export function ThumbnailSilhouetteMockup({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex w-[11.5rem] shrink-0 flex-col overflow-hidden rounded-lg border-2 border-[var(--ink)] bg-[#FFF8E8] shadow-sm",
        className,
      )}
      aria-hidden
    >
      <div className="bg-[linear-gradient(90deg,#ED2024_0%,#F15A22_55%,#FFD400_100%)] px-1.5 py-1.5 text-center">
        <p className="text-[9px] font-extrabold leading-tight tracking-tight text-white">
          Your Love&apos;s Enterprise Sales Team
        </p>
      </div>
      <div className="flex flex-1 items-center px-1.5 py-2">
        <div className="grid w-full grid-cols-4 gap-1">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="min-w-0">
              <div className="aspect-[3/4] overflow-hidden rounded-sm border border-[var(--ink)]/40 bg-[#94a3b8]">
                <TeamPhotoSilhouette title="" />
              </div>
              <div className="mt-0.5 rounded-sm bg-white px-0.5 py-0.5 text-center">
                <div className="mx-auto h-1 w-3/4 rounded-full bg-[var(--ink)]/70" />
                <div className="mx-auto mt-0.5 h-0.5 w-1/2 rounded-full bg-[var(--ink)]/35" />
                <div className="mx-auto mt-0.5 h-0.5 w-2/3 rounded-full bg-[var(--ink)]/25" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
