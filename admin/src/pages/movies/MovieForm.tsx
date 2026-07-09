import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Modal from '@/components/ui/Modal';
import { Input, TextArea } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { listGenres, listCategories } from '@/api/taxonomyApi';
import { Movie } from '@/types';
import type { MoviePayload as Payload } from '@/api/movieApi';
import { uploadFile, getTranscodeStatus } from '@/api/uploadApi';
import toast from 'react-hot-toast';

interface MovieFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: Payload) => Promise<void>;
  initial?: Movie | null;
  isSaving?: boolean;
}

const EMPTY: Payload = {
  title: '',
  description: '',
  releaseYear: new Date().getFullYear(),
  duration: 90,
  ageRating: 'PG-13',
  genres: [],
  categories: [],
  cast: [],
  director: '',
  poster: '',
  banner: '',
  trailerUrl: '',
  hlsMasterPlaylistUrl: '',
};

export default function MovieForm({ isOpen, onClose, onSubmit, initial, isSaving }: MovieFormProps) {
  const [form, setForm] = useState<Payload>(EMPTY);
  const [castInput, setCastInput] = useState('');

  const [videoUploading, setVideoUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState(0);
  const [jobError, setJobError] = useState<string | null>(null);

  const { data: genres = [] } = useQuery({ queryKey: ['genres'], queryFn: listGenres });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: listCategories });

  function extractJobId(hlsUrl: string | undefined): string | null {
    if (!hlsUrl) return null;
    const match = hlsUrl.match(/transcoded\/(?:[^\/]+\/)?(job-[\w-]+)\/master\.m3u8/);
    return match ? match[1] : null;
  }

  useEffect(() => {
    if (initial) {
      setForm({
        title: initial.title,
        description: initial.description,
        releaseYear: initial.releaseYear,
        duration: initial.duration,
        ageRating: initial.ageRating,
        genres: initial.genres.map((g) => g._id),
        categories: initial.categories.map((c) => c._id),
        cast: initial.cast,
        director: initial.director,
        poster: initial.poster,
        banner: initial.banner,
        trailerUrl: initial.trailerUrl,
        hlsMasterPlaylistUrl: initial.hlsMasterPlaylistUrl || '',
      });
      setCastInput(initial.cast.join(', '));

      if (initial.hlsMasterPlaylistUrl) {
        const parsedJobId = extractJobId(initial.hlsMasterPlaylistUrl);
        if (parsedJobId) {
          setJobId(parsedJobId);
          const isCompleted = initial.status !== 'processing' && initial.status !== 'failed';
          setJobStatus(isCompleted ? 'completed' : initial.status);
          setJobProgress(isCompleted ? 100 : 0);
          setJobError(null);
        }
      } else {
        setJobId(null);
        setJobStatus(null);
        setJobProgress(0);
        setJobError(null);
      }
    } else {
      setForm(EMPTY);
      setCastInput('');
      setJobId(null);
      setJobStatus(null);
      setJobProgress(0);
      setJobError(null);
    }
  }, [initial, isOpen]);

  useEffect(() => {
    let intervalId: any = null;

    if (jobId && (jobStatus === 'queued' || jobStatus === 'processing')) {
      intervalId = setInterval(async () => {
        try {
          const status = await getTranscodeStatus(jobId);
          setJobStatus(status.status);
          setJobProgress(status.progress);
          if (status.status === 'completed') {
            setForm((prev) => ({ ...prev, hlsMasterPlaylistUrl: status.hlsMasterPlaylistUrl }));
            clearInterval(intervalId);
            toast.success('HLS Transcoding completed!');
          } else if (status.status === 'failed') {
            setJobError(status.error || 'Transcoding failed');
            clearInterval(intervalId);
            toast.error('HLS Transcoding failed.');
          }
        } catch (err) {
          // Keep polling, ignore fetch errors
        }
      }, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [jobId, jobStatus]);

  async function handleVideoUpload(file: File) {
    setVideoUploading(true);
    setUploadProgress(0);
    setJobError(null);
    setJobId(null);
    setJobStatus(null);
    
    try {
      const result = await uploadFile('video', file, (percent) => {
        setUploadProgress(percent);
      });
      toast.success('Video uploaded. HLS Transcoding started in background.');
      setForm((prev) => ({ ...prev, hlsMasterPlaylistUrl: result.url }));
      if (result.jobId) {
        setJobId(result.jobId);
        setJobStatus(result.status || 'queued');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Video upload failed';
      setJobError(msg);
      toast.error(msg);
    } finally {
      setVideoUploading(false);
    }
  }

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
    <Modal isOpen={isOpen} onClose={onClose} title={initial ? 'Edit Movie' : 'Upload Movie'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
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
            label="Duration (min)"
            type="number"
            required
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
          />
          <Input
            label="Age Rating"
            value={form.ageRating}
            onChange={(e) => setForm({ ...form, ageRating: e.target.value })}
          />
        </div>

        <Input
          label="Director"
          value={form.director}
          onChange={(e) => setForm({ ...form, director: e.target.value })}
        />
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
              {genres.length === 0 && <span className="text-xs text-muted">No genres yet</span>}
              {genres.map((g) => (
                <button
                  type="button"
                  key={g._id}
                  onClick={() => toggleMulti('genres', g._id)}
                  className={`rounded-full border px-2.5 py-1 text-xs ${
                    form.genres?.includes(g._id)
                      ? 'border-accent bg-accent/20 text-accent'
                      : 'border-border text-muted hover:text-text'
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
              {categories.length === 0 && <span className="text-xs text-muted">No categories yet</span>}
              {categories.map((c) => (
                <button
                  type="button"
                  key={c._id}
                  onClick={() => toggleMulti('categories', c._id)}
                  className={`rounded-full border px-2.5 py-1 text-xs ${
                    form.categories?.includes(c._id)
                      ? 'border-accent bg-accent/20 text-accent'
                      : 'border-border text-muted hover:text-text'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Poster URL"
            value={form.poster}
            onChange={(e) => setForm({ ...form, poster: e.target.value })}
            placeholder="https://…"
          />
          <Input
            label="Banner URL"
            value={form.banner}
            onChange={(e) => setForm({ ...form, banner: e.target.value })}
            placeholder="https://…"
          />
        </div>
        <Input
          label="Trailer URL"
          value={form.trailerUrl}
          onChange={(e) => setForm({ ...form, trailerUrl: e.target.value })}
          placeholder="https://…"
        />

        <div className="rounded-md border border-border bg-surface2 p-4 space-y-3">
          <span className="block text-xs font-mono uppercase tracking-wider text-muted">Movie Video File (Adaptive HLS)</span>
          
          <Input
            label="HLS Master Playlist URL"
            value={form.hlsMasterPlaylistUrl || ''}
            onChange={(e) => setForm({ ...form, hlsMasterPlaylistUrl: e.target.value })}
            placeholder="Upload a video below or paste a master.m3u8 URL"
          />

          <div className="flex items-center gap-4 pt-1">
            <input
              type="file"
              accept="video/*"
              id="movie-video-file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleVideoUpload(file);
              }}
            />
            <button
              type="button"
              disabled={videoUploading || jobStatus === 'queued' || jobStatus === 'processing'}
              onClick={() => document.getElementById('movie-video-file')?.click()}
              className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-40"
            >
              {videoUploading ? 'Uploading...' : 'Choose Video File'}
            </button>
            <span className="text-[11px] text-muted">Supports MP4, MKV, WebM. Automatically transcoded into adaptive HLS (240p-1080p).</span>
          </div>

          {videoUploading && (
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] text-muted">
                <span>Uploading to server...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
                <div className="h-full bg-accent transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          {jobStatus && (
            <div className="rounded border border-border bg-surface p-3 space-y-2 mt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-text flex items-center gap-1.5">
                  Transcoding Status: 
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                    jobStatus === 'completed' ? 'bg-live/15 text-live' : 
                    jobStatus === 'failed' ? 'bg-accent/15 text-accent' : 'bg-yellow-500/15 text-yellow-500'
                  }`}>
                    {jobStatus}
                  </span>
                </span>
                {jobStatus !== 'completed' && jobStatus !== 'failed' && (
                  <span className="font-mono text-muted text-[11px]">{jobProgress}%</span>
                )}
              </div>

              {jobStatus !== 'completed' && jobStatus !== 'failed' && (
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface2">
                  <div className="h-full bg-live transition-all animate-pulse" style={{ width: `${jobProgress}%` }} />
                </div>
              )}

              {jobError && (
                <p className="text-[11px] text-accent mt-1">Error: {jobError}</p>
              )}

              {jobStatus === 'completed' && (
                <p className="text-[11px] text-live mt-1">Transcoding complete. HLS playlist generated and bound.</p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving || videoUploading}>
            {initial ? 'Save changes' : 'Create movie'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
