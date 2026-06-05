import { useEffect, useState } from 'react';

interface VideoPlayerProps {
  youtubeVideoId: string;
  startTime?: number;
}

export default function VideoPlayer({
  youtubeVideoId,
  startTime,
}: VideoPlayerProps) {
  const [iframeSrc, setIframeSrc] = useState('');

  useEffect(() => {
    const base = `https://www.youtube.com/embed/${youtubeVideoId}`;
    const params = new URLSearchParams({
      rel: '0',
      modestbranding: '1',
      ...(startTime !== undefined ? { start: String(Math.floor(startTime)) } : {}),
    });
    setIframeSrc(`${base}?${params.toString()}`);
  }, [youtubeVideoId, startTime]);

  return (
    <div className="glass overflow-hidden rounded-2xl shadow-2xl shadow-black/30">
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        <iframe
          src={iframeSrc}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    </div>
  );
}
