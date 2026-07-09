import { FormEvent, useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Trash2, Play } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { Input, TextArea } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { listEpisodes, createEpisode, deleteEpisode, EpisodePayload } from '@/api/seriesApi';
import { Series } from '@/types';
import { uploadFile, getTranscodeStatus } from '@/api/uploadApi';
import VideoPreviewModal from '@/components/VideoPreviewModal';

interface EpisodesModalProps {
  series: Series | null;
  onClose: () => void;
}

const EMPTY: EpisodePayload = { 
  season: 1, 
  episodeNumber: 1, 
  title: '', 
  description: '', 
  duration: 0, 
  thumbnail: '',
  hlsMasterPlaylistUrl: '' 
};

export default function EpisodesModal({ series, onClose }: EpisodesModalProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<EpisodePayload>(EMPTY);

  const [videoUploading, setVideoUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState(0);
  const [jobError, setJobError] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState<{ url: string; title: string } | null>(null);

  const { data: episodes = [], isLoading } = useQuery({
    queryKey: ['episodes', series?._id],
    queryFn: () => listEpisodes(series!._id),
    enabled: !!series,
  });

  function extractJobId(hlsUrl: string | undefined): string | null {
    if (!hlsUrl) return null;
    const match = hlsUrl.match(/transcoded\/(?:[^\/]+\/)?(job-[\w-]+)\/master\.m3u8/);
    return match ? match[1] : null;
  }

  // Poll transcode status when jobId is active
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
          // Ignore
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
      toast.success('Episode video uploaded. HLS Transcoding started in background.');
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

  const createMutation = useMutation({
    mutationFn: (payload: EpisodePayload) => createEpisode(series!._id, payload),
    onSuccess: () => {
      toast.success('Episode added');
      setForm({ ...EMPTY, season: form.season, episodeNumber: form.episodeNumber + 1 });
      setJobId(null);
      setJobStatus(null);
      setJobProgress(0);
      setJobError(null);
      queryClient.invalidateQueries({ queryKey: ['episodes', series?._id] });
    },
    onError: () => toast.error('Failed to add episode'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEpisode(id),
    onSuccess: () => {
      toast.success('Episode removed');
      queryClient.invalidateQueries({ queryKey: ['episodes', series?._id] });
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    createMutation.mutate(form);
  }

  return (
    <Modal isOpen={!!series} onClose={onClose} title={`Episodes — ${series?.title ?? ''}`} size="lg">
      <div className="space-y-5">
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 rounded-md border border-border bg-surface2 p-4">
          <Input
            label="Season"
            type="number"
            min={1}
            value={form.season}
            onChange={(e) => setForm({ ...form, season: Number(e.target.value) })}
          />
          <Input
            label="Episode #"
            type="number"
            min={1}
            value={form.episodeNumber}
            onChange={(e) => setForm({ ...form, episodeNumber: Number(e.target.value) })}
          />
          <div className="col-span-2">
            <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="col-span-2">
            <TextArea
              label="Description"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <Input
            label="Duration (min)"
            type="number"
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
          />
          <Input label="Thumbnail URL" value={form.thumbnail} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} />
          
          <div className="col-span-2 rounded border border-border bg-surface p-3 space-y-2.5 mt-1">
            <span className="block text-xs font-mono uppercase tracking-wider text-muted">Episode Video File (HLS)</span>
            <Input 
              label="HLS Playlist URL" 
              value={form.hlsMasterPlaylistUrl || ''} 
              onChange={(e) => setForm({ ...form, hlsMasterPlaylistUrl: e.target.value })}
              placeholder="Upload a video below or paste a master.m3u8 URL"
            />
            
            <div className="flex items-center gap-4 pt-1">
              <input
                type="file"
                accept="video/*"
                id="episode-video-file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleVideoUpload(file);
                }}
              />
              <button
                type="button"
                disabled={videoUploading || jobStatus === 'queued' || jobStatus === 'processing'}
                onClick={() => document.getElementById('episode-video-file')?.click()}
                className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-40"
              >
                {videoUploading ? 'Uploading...' : 'Choose Episode Video'}
              </button>
              <span className="text-[10px] text-muted">Transcoded to HLS (240p-1080p)</span>
            </div>

            {videoUploading && (
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[11px] text-muted">
                  <span>Uploading to server...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface2">
                  <div className="h-full bg-accent transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            {jobStatus && (
              <div className="rounded border border-border bg-surface2 p-3 space-y-2 mt-2">
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
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
                    <div className="h-full bg-live transition-all animate-pulse" style={{ width: `${jobProgress}%` }} />
                  </div>
                )}

                {jobError && (
                  <p className="text-[11px] text-accent">Error: {jobError}</p>
                )}

                {jobStatus === 'completed' && (
                  <p className="text-[11px] text-live">Transcoding complete. Ready to add!</p>
                )}
              </div>
            )}
          </div>

          <div className="col-span-2 flex justify-end gap-2 pt-2">
            <Button type="submit" isLoading={createMutation.isPending || videoUploading}>
              <Plus size={16} /> Add Episode
            </Button>
          </div>
        </form>

        <div className="rounded-md border border-border bg-surface">
          {isLoading && <p className="px-4 py-4 text-sm text-muted">Loading episodes…</p>}
          {!isLoading && episodes.length === 0 && <p className="px-4 py-4 text-sm text-muted">No episodes yet.</p>}
          <ul>
            {episodes.map((ep) => (
              <li key={ep._id} className="flex items-center justify-between border-b border-border/60 px-4 py-3 last:border-0 hover:bg-surface2/30">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted">
                    S{String(ep.season).padStart(2, '0')}E{String(ep.episodeNumber).padStart(2, '0')}
                  </span>
                  <span className="text-sm text-text font-medium">{ep.title}</span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={ep.status} />
                  <button
                    title={ep.hlsMasterPlaylistUrl ? 'Watch Preview' : 'No video file linked'}
                    onClick={() => setPreviewVideo({ url: ep.hlsMasterPlaylistUrl!, title: ep.title })}
                    disabled={!ep.hlsMasterPlaylistUrl}
                    className="rounded p-1 text-live hover:text-live/85 hover:bg-live/15 disabled:opacity-25 disabled:hover:bg-transparent"
                  >
                    <Play size={13} fill="currentColor" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(ep._id)}
                    className="rounded p-1.5 text-muted hover:text-accent"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <VideoPreviewModal
        isOpen={!!previewVideo}
        onClose={() => setPreviewVideo(null)}
        url={previewVideo?.url || ''}
        title={previewVideo?.title || ''}
      />
    </Modal>
  );
}
