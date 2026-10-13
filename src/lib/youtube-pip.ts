/** Build a muted, looping YouTube embed URL for PIP previews. */
export function youtubePipEmbedSrc(youtubeId: string): string {
  const id = youtubeId.trim();
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    muted: "1",
    controls: "0",
    modestbranding: "1",
    playsinline: "1",
    rel: "0",
    loop: "1",
    playlist: id,
    enablejsapi: "1",
  });
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}
