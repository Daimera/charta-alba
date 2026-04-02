"use client";

interface VideoEmbedProps {
  url: string;
}

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1);
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
  } catch {
    // not a valid URL
  }
  return null;
}

export function VideoEmbed({ url }: VideoEmbedProps) {
  const videoId = getYouTubeId(url);
  if (!videoId) return null;

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/40 mb-4">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
        title="Paper video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}
