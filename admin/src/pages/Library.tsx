import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Play, Film } from 'lucide-react';
import { listMovies } from '@/api/movieApi';
import { useAuth } from '@/context/AuthContext';
import VideoPreviewModal from '@/components/VideoPreviewModal';

export default function Library() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [previewVideo, setPreviewVideo] = useState<{ url: string; title: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['library-movies'],
    queryFn: () => listMovies({ page: 1, limit: 100, status: 'published' }),
  });

  // Filter movies by search locally
  const movies = data?.movies || [];
  const filteredMovies = movies.filter((movie) => {
    const term = search.toLowerCase();
    return (
      movie.title.toLowerCase().includes(term) ||
      (movie.description && movie.description.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-accent/20 via-surface2 to-surface p-8 border border-border shadow-panel">
        <div className="relative z-10 space-y-2">
          <h1 className="text-2xl font-bold text-text md:text-3xl font-display">
            Welcome back, <span className="text-accent">{user?.name}</span>!
          </h1>
          <p className="text-muted text-sm max-w-xl leading-relaxed">
            Browse through your catalog, select any movie, and stream it instantly using our adaptive HLS video player.
          </p>
        </div>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none hidden md:block">
          <Film size={200} />
        </div>
      </div>

      {/* Search Header Row */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your video collection..."
            className="w-full rounded-lg border border-border bg-surface2 py-2.5 pl-10 pr-4 text-sm text-text placeholder:text-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all"
          />
        </div>
        <div className="text-xs font-mono text-muted">
          Showing {filteredMovies.length} videos
        </div>
      </div>

      {/* Videos Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : filteredMovies.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-xl border border-dashed border-border/80 text-center p-8 bg-surface">
          <Film className="text-muted/40 mb-3" size={40} />
          <p className="text-sm text-muted">No movies found in your collection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filteredMovies.map((movie) => {
            const hasVideo = !!(movie.hlsMasterPlaylistUrl || movie.trailerUrl);
            return (
              <div
                key={movie._id}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-md hover:border-accent/40 hover:shadow-glow transition-all duration-300"
              >
                {/* Poster Cover Wrapper */}
                <div className="aspect-[2/3] relative w-full overflow-hidden bg-surface2">
                  {movie.poster ? (
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted/30">
                      <Film size={36} />
                    </div>
                  )}

                  {/* Play Action Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                    <button
                      disabled={!hasVideo}
                      onClick={() => {
                        const url = movie.hlsMasterPlaylistUrl || movie.trailerUrl || '';
                        setPreviewVideo({ url, title: movie.title });
                      }}
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-glow hover:scale-110 active:scale-95 disabled:bg-muted disabled:opacity-40 disabled:scale-100 transition-transform duration-200"
                      title={hasVideo ? 'Play movie' : 'No video file linked'}
                    >
                      <Play size={20} fill="currentColor" className="translate-x-0.5" />
                    </button>
                  </div>
                </div>

                {/* Info Metadata */}
                <div className="p-3.5 space-y-1">
                  <h3 className="font-semibold text-sm text-text line-clamp-1 group-hover:text-accent transition-colors duration-200">
                    {movie.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-muted font-mono">
                    <span>{movie.releaseYear}</span>
                    <span>&bull;</span>
                    <span>{movie.duration}m</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Custom Player Modal */}
      <VideoPreviewModal
        isOpen={!!previewVideo}
        onClose={() => setPreviewVideo(null)}
        url={previewVideo?.url || ''}
        title={previewVideo?.title || ''}
      />
    </div>
  );
}
