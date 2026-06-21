import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Video, Clock, Loader2 } from 'lucide-react';
import { getVideos } from '../api/client';
import type { Video as VideoType } from '../types';

interface SidebarProps {
  currentVideoId: string;
}

export default function Sidebar({ currentVideoId }: SidebarProps) {
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVideos(0, 20)
      .then((res) => setVideos(res.videos))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="glass rounded-2xl">
      {/* Header */}
      <div className="border-b border-surface-light/30 px-5 py-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-text">
          <Video className="h-4 w-4 text-primary" />
          Video History
        </h3>
      </div>

      {/* Video list */}
      <div className="max-h-[600px] overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : videos.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-xs text-text-dim">No videos yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {videos.map((video, i) => {
              const isActive = video.id === currentVideoId;
              return (
                <Link
                  key={video.id}
                  to={`/video/${video.id}`}
                  className={`animate-slide-in group flex gap-3 rounded-xl p-3 transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-surface-light/20'
                  }`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {/* Thumbnail */}
                  <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-light/30">
                    <img
                      src={video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_video_id}/default.jpg`}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = `https://img.youtube.com/vi/${video.youtube_video_id}/default.jpg`;
                      }}
                    />
                    {isActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/30">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`line-clamp-2 text-xs font-medium leading-tight ${
                        isActive ? 'text-primary-light' : 'text-text-muted group-hover:text-text'
                      }`}
                    >
                      {video.title || 'Untitled Video'}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-[9px] text-text-dim">
                      <span className="font-semibold truncate max-w-[80px]">{video.channel_name || 'YouTube'}</span>
                      <div className="flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(video.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
