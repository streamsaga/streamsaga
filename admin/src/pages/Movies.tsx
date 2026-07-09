import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Star, TrendingUp, Eye, EyeOff, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  listMovies,
  createMovie,
  updateMovie,
  deleteMovie,
  publishMovie,
  unpublishMovie,
  toggleFeatured,
  toggleTrending,
  MoviePayload,
} from '@/api/movieApi';
import { Movie } from '@/types';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import Pagination from '@/components/ui/Pagination';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import MovieForm from './movies/MovieForm';
import VideoPreviewModal from '@/components/VideoPreviewModal';

export default function Movies() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Movie | null>(null);
  const [deleting, setDeleting] = useState<Movie | null>(null);
  const [previewVideo, setPreviewVideo] = useState<{ url: string; title: string } | null>(null);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['movies', page, search],
    queryFn: () => listMovies({ page, limit: 10, search: search || undefined }),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['movies'] });
  }

  const createMutation = useMutation({
    mutationFn: (payload: MoviePayload) => createMovie(payload),
    onSuccess: () => {
      toast.success('Movie created as draft');
      setFormOpen(false);
      invalidate();
    },
    onError: () => toast.error('Failed to create movie'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<MoviePayload> }) => updateMovie(id, payload),
    onSuccess: () => {
      toast.success('Movie updated');
      setFormOpen(false);
      setEditing(null);
      invalidate();
    },
    onError: () => toast.error('Failed to update movie'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMovie(id),
    onSuccess: () => {
      toast.success('Movie deleted');
      setDeleting(null);
      invalidate();
    },
    onError: () => toast.error('Failed to delete movie'),
  });

  const publishMutation = useMutation({
    mutationFn: (movie: Movie) => (movie.status === 'published' ? unpublishMovie(movie._id) : publishMovie(movie._id)),
    onSuccess: invalidate,
  });

  const featuredMutation = useMutation({ mutationFn: (id: string) => toggleFeatured(id), onSuccess: invalidate });
  const trendingMutation = useMutation({ mutationFn: (id: string) => toggleTrending(id), onSuccess: invalidate });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search movies…"
            className="w-full rounded-md border border-border bg-surface2 py-2 pl-9 pr-3 text-sm text-text placeholder:text-muted/60 focus:border-accent focus:outline-none"
          />
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus size={16} /> Upload Movie
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-panel">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface2 font-mono text-[11px] uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Year</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Views</th>
              <th className="px-4 py-3">Flags</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted">
                  Loading movies…
                </td>
              </tr>
            )}
            {!isLoading && data?.movies.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  No movies yet. Click "Upload Movie" to add your first title.
                </td>
              </tr>
            )}
            {data?.movies.map((movie) => (
              <tr key={movie._id} className="border-b border-border/60 last:border-0 hover:bg-surface2/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {movie.poster ? (
                      <img src={movie.poster} alt="" className="h-12 w-8 rounded object-cover" />
                    ) : (
                      <div className="h-12 w-8 rounded bg-surface2" />
                    )}
                    <span className="font-medium text-text">{movie.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-muted">{movie.releaseYear}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={movie.status} />
                </td>
                <td className="px-4 py-3 font-mono text-muted">{movie.views.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <button
                      title="Toggle featured"
                      onClick={() => featuredMutation.mutate(movie._id)}
                      className={`rounded p-1 ${movie.isFeatured ? 'text-accent' : 'text-muted hover:text-text'}`}
                    >
                      <Star size={15} fill={movie.isFeatured ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      title="Toggle trending"
                      onClick={() => trendingMutation.mutate(movie._id)}
                      className={`rounded p-1 ${movie.isTrending ? 'text-live' : 'text-muted hover:text-text'}`}
                    >
                      <TrendingUp size={15} />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <button
                      title={movie.hlsMasterPlaylistUrl || movie.trailerUrl ? 'Watch Preview' : 'No preview available'}
                      onClick={() => {
                        const url = movie.hlsMasterPlaylistUrl || movie.trailerUrl || '';
                        setPreviewVideo({ url, title: movie.title });
                      }}
                      disabled={!movie.hlsMasterPlaylistUrl && !movie.trailerUrl}
                      className="rounded p-1.5 text-live hover:text-live/85 hover:bg-live/15 disabled:opacity-25 disabled:hover:bg-transparent"
                    >
                      <Play size={15} fill="currentColor" />
                    </button>
                    <button
                      title={movie.status === 'published' ? 'Unpublish' : 'Publish'}
                      onClick={() => publishMutation.mutate(movie)}
                      className="rounded p-1.5 text-muted hover:text-text"
                    >
                      {movie.status === 'published' ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    <button
                      title="Edit"
                      onClick={() => {
                        setEditing(movie);
                        setFormOpen(true);
                      }}
                      className="rounded p-1.5 text-muted hover:text-text"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      title="Delete"
                      onClick={() => setDeleting(movie)}
                      className="rounded p-1.5 text-muted hover:text-accent"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data && (
          <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onChange={setPage} />
        )}
      </div>

      <MovieForm
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        initial={editing}
        isSaving={createMutation.isPending || updateMutation.isPending}
        onSubmit={async (payload) => {
          if (editing) {
            await updateMutation.mutateAsync({ id: editing._id, payload });
          } else {
            await createMutation.mutateAsync(payload);
          }
        }}
      />

      <ConfirmDialog
        isOpen={!!deleting}
        title="Delete Movie"
        message={`Are you sure you want to delete "${deleting?.title}"? This cannot be undone.`}
        isLoading={deleteMutation.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting._id)}
      />

      <VideoPreviewModal
        isOpen={!!previewVideo}
        onClose={() => setPreviewVideo(null)}
        url={previewVideo?.url || ''}
        title={previewVideo?.title || ''}
      />
    </div>
  );
}
