import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { listGenres, createGenre, updateGenre, deleteGenre } from '@/api/taxonomyApi';
import { Genre } from '@/types';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function Genres() {
  const queryClient = useQueryClient();
  const { data: genres = [], isLoading } = useQuery({ queryKey: ['genres'], queryFn: listGenres });

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleting, setDeleting] = useState<Genre | null>(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['genres'] });
  }

  const createMutation = useMutation({
    mutationFn: (name: string) => createGenre(name),
    onSuccess: () => {
      setNewName('');
      invalidate();
      toast.success('Genre added');
    },
    onError: () => toast.error('Failed to add genre'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateGenre(id, name),
    onSuccess: () => {
      setEditingId(null);
      invalidate();
      toast.success('Genre updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteGenre(id),
    onSuccess: () => {
      setDeleting(null);
      invalidate();
      toast.success('Genre deleted');
    },
  });

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    createMutation.mutate(newName.trim());
  }

  return (
    <div className="max-w-2xl space-y-4">
      <form onSubmit={handleCreate} className="flex gap-3">
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Science Fiction" />
        <Button type="submit" isLoading={createMutation.isPending}>
          <Plus size={16} /> Add
        </Button>
      </form>

      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-panel">
        {isLoading && <p className="px-4 py-6 text-sm text-muted">Loading genres…</p>}
        {!isLoading && genres.length === 0 && <p className="px-4 py-6 text-sm text-muted">No genres yet.</p>}
        <ul>
          {genres.map((genre) => (
            <li key={genre._id} className="flex items-center justify-between border-b border-border/60 px-4 py-3 last:border-0">
              {editingId === genre._id ? (
                <input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="mr-3 flex-1 rounded-md border border-accent bg-surface2 px-2 py-1 text-sm text-text focus:outline-none"
                />
              ) : (
                <span className="text-sm text-text">{genre.name}</span>
              )}
              <div className="flex gap-1.5">
                {editingId === genre._id ? (
                  <>
                    <button
                      onClick={() => updateMutation.mutate({ id: genre._id, name: editingName })}
                      className="rounded p-1.5 text-live hover:bg-surface2"
                    >
                      <Check size={15} />
                    </button>
                    <button onClick={() => setEditingId(null)} className="rounded p-1.5 text-muted hover:bg-surface2">
                      <X size={15} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditingId(genre._id);
                        setEditingName(genre.name);
                      }}
                      className="rounded p-1.5 text-muted hover:text-text"
                    >
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => setDeleting(genre)} className="rounded p-1.5 text-muted hover:text-accent">
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <ConfirmDialog
        isOpen={!!deleting}
        title="Delete Genre"
        message={`Delete "${deleting?.name}"? Movies using this genre will keep their other tags.`}
        isLoading={deleteMutation.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting._id)}
      />
    </div>
  );
}
