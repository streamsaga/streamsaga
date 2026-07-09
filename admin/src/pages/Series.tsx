import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, ListVideo, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  listSeries,
  createSeries,
  updateSeries,
  deleteSeries,
  publishSeries,
  unpublishSeries,
  SeriesPayload,
} from '@/api/seriesApi';
import { Series as SeriesType } from '@/types';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import Pagination from '@/components/ui/Pagination';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import SeriesForm from './series/SeriesForm';
import EpisodesModal from './series/EpisodesModal';

export default function Series() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SeriesType | null>(null);
  const [deleting, setDeleting] = useState<SeriesType | null>(null);
  const [episodesFor, setEpisodesFor] = useState<SeriesType | null>(null);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['series', page, search],
    queryFn: () => listSeries({ page, limit: 10, search: search || undefined }),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['series'] });
  }

  const createMutation = useMutation({
    mutationFn: (payload: SeriesPayload) => createSeries(payload),
    onSuccess: () => {
      toast.success('Series created as draft');
      setFormOpen(false);
      invalidate();
    },
    onError: () => toast.error('Failed to create series'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<SeriesPayload> }) => updateSeries(id, payload),
    onSuccess: () => {
      toast.success('Series updated');
      setFormOpen(false);
      setEditing(null);
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSeries(id),
    onSuccess: () => {
      toast.success('Series deleted');
      setDeleting(null);
      invalidate();
    },
  });

  const publishMutation = useMutation({
    mutationFn: (s: SeriesType) => (s.status === 'published' ? unpublishSeries(s._id) : publishSeries(s._id)),
    onSuccess: invalidate,
  });

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
            placeholder="Search series…"
            className="w-full rounded-md border border-border bg-surface2 py-2 pl-9 pr-3 text-sm text-text placeholder:text-muted/60 focus:border-accent focus:outline-none"
          />
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus size={16} /> Upload Series
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-panel">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface2 font-mono text-[11px] uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Seasons</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Views</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">
                  Loading series…
                </td>
              </tr>
            )}
            {!isLoading && data?.series.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  No series yet. Click "Upload Series" to add your first show.
                </td>
              </tr>
            )}
            {data?.series.map((s) => (
              <tr key={s._id} className="border-b border-border/60 last:border-0 hover:bg-surface2/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {s.poster ? (
                      <img src={s.poster} alt="" className="h-12 w-8 rounded object-cover" />
                    ) : (
                      <div className="h-12 w-8 rounded bg-surface2" />
                    )}
                    <span className="font-medium text-text">{s.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-muted">{s.totalSeasons}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={s.status} />
                </td>
                <td className="px-4 py-3 font-mono text-muted">{s.views.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <button title="Manage episodes" onClick={() => setEpisodesFor(s)} className="rounded p-1.5 text-muted hover:text-text">
                      <ListVideo size={15} />
                    </button>
                    <button
                      title={s.status === 'published' ? 'Unpublish' : 'Publish'}
                      onClick={() => publishMutation.mutate(s)}
                      className="rounded p-1.5 text-muted hover:text-text"
                    >
                      {s.status === 'published' ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    <button
                      title="Edit"
                      onClick={() => {
                        setEditing(s);
                        setFormOpen(true);
                      }}
                      className="rounded p-1.5 text-muted hover:text-text"
                    >
                      <Pencil size={15} />
                    </button>
                    <button title="Delete" onClick={() => setDeleting(s)} className="rounded p-1.5 text-muted hover:text-accent">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onChange={setPage} />}
      </div>

      <SeriesForm
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

      <EpisodesModal series={episodesFor} onClose={() => setEpisodesFor(null)} />

      <ConfirmDialog
        isOpen={!!deleting}
        title="Delete Series"
        message={`Delete "${deleting?.title}" and all its episodes? This cannot be undone.`}
        isLoading={deleteMutation.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting._id)}
      />
    </div>
  );
}
