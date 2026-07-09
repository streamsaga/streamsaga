import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Modal from '@/components/ui/Modal';
import { Input, TextArea } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { listGenres, listCategories } from '@/api/taxonomyApi';
import { Series } from '@/types';
import type { SeriesPayload as Payload } from '@/api/seriesApi';

interface SeriesFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: Payload) => Promise<void>;
  initial?: Series | null;
  isSaving?: boolean;
}

const EMPTY: Payload = {
  title: '',
  description: '',
  releaseYear: new Date().getFullYear(),
  ageRating: 'PG-13',
  genres: [],
  categories: [],
  cast: [],
  poster: '',
  banner: '',
  trailerUrl: '',
  totalSeasons: 1,
};

export default function SeriesForm({ isOpen, onClose, onSubmit, initial, isSaving }: SeriesFormProps) {
  const [form, setForm] = useState<Payload>(EMPTY);
  const [castInput, setCastInput] = useState('');

  const { data: genres = [] } = useQuery({ queryKey: ['genres'], queryFn: listGenres });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: listCategories });

  useEffect(() => {
    if (initial) {
      setForm({
        title: initial.title,
        description: initial.description,
        releaseYear: initial.releaseYear,
        ageRating: initial.ageRating,
        genres: initial.genres.map((g) => g._id),
        categories: initial.categories.map((c) => c._id),
        cast: initial.cast,
        poster: initial.poster,
        banner: initial.banner,
        trailerUrl: initial.trailerUrl,
        totalSeasons: initial.totalSeasons,
      });
      setCastInput(initial.cast.join(', '));
    } else {
      setForm(EMPTY);
      setCastInput('');
    }
  }, [initial, isOpen]);

  function toggleMulti(field: 'genres' | 'categories', id: string) {
    setForm((prev) => {
      const current = prev[field] ?? [];
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
      return { ...prev, [field]: next };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({
      ...form,
      cast: castInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initial ? 'Edit Series' : 'Upload Series'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <TextArea
          label="Description"
          required
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Release Year"
            type="number"
            required
            value={form.releaseYear}
            onChange={(e) => setForm({ ...form, releaseYear: Number(e.target.value) })}
          />
          <Input
            label="Total Seasons"
            type="number"
            required
            value={form.totalSeasons}
            onChange={(e) => setForm({ ...form, totalSeasons: Number(e.target.value) })}
          />
          <Input label="Age Rating" value={form.ageRating} onChange={(e) => setForm({ ...form, ageRating: e.target.value })} />
        </div>

        <Input
          label="Cast (comma separated)"
          value={castInput}
          onChange={(e) => setCastInput(e.target.value)}
          placeholder="Actor One, Actor Two"
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="mb-1.5 block text-sm font-medium text-muted">Genres</span>
            <div className="flex flex-wrap gap-2 rounded-md border border-border bg-surface2 p-2">
              {genres.map((g) => (
                <button
                  type="button"
                  key={g._id}
                  onClick={() => toggleMulti('genres', g._id)}
                  className={`rounded-full border px-2.5 py-1 text-xs ${
                    form.genres?.includes(g._id) ? 'border-accent bg-accent/20 text-accent' : 'border-border text-muted hover:text-text'
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="mb-1.5 block text-sm font-medium text-muted">Categories</span>
            <div className="flex flex-wrap gap-2 rounded-md border border-border bg-surface2 p-2">
              {categories.map((c) => (
                <button
                  type="button"
                  key={c._id}
                  onClick={() => toggleMulti('categories', c._id)}
                  className={`rounded-full border px-2.5 py-1 text-xs ${
                    form.categories?.includes(c._id) ? 'border-accent bg-accent/20 text-accent' : 'border-border text-muted hover:text-text'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Poster URL" value={form.poster} onChange={(e) => setForm({ ...form, poster: e.target.value })} />
          <Input label="Banner URL" value={form.banner} onChange={(e) => setForm({ ...form, banner: e.target.value })} />
        </div>
        <Input label="Trailer URL" value={form.trailerUrl} onChange={(e) => setForm({ ...form, trailerUrl: e.target.value })} />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving}>
            {initial ? 'Save changes' : 'Create series'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
