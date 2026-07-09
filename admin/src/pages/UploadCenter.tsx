import { useCallback, useRef, useState } from 'react';
import { UploadCloud, FileVideo, Image as ImageIcon, X, CheckCircle2, AlertCircle, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadFile, getTranscodeStatus, UploadKind } from '@/api/uploadApi';

interface QueueItem {
  id: string;
  file: File;
  kind: UploadKind;
  progress: number;
  status: 'queued' | 'uploading' | 'transcoding' | 'done' | 'error';
  url?: string;
  error?: string;
  jobId?: string;
  transcodeStatus?: string;
  transcodeProgress?: number;
}

const KIND_OPTIONS: { value: UploadKind; label: string }[] = [
  { value: 'video', label: 'Movie / Episode File' },
  { value: 'trailer', label: 'Trailer' },
  { value: 'poster', label: 'Poster' },
  { value: 'banner', label: 'Banner' },
];

function inferKind(file: File): UploadKind {
  return file.type.startsWith('video') ? 'video' : 'poster';
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
}

export default function UploadCenter() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalUploadedBytes = queue
    .filter((q) => q.status === 'done')
    .reduce((sum, q) => sum + q.file.size, 0);

  function addFiles(files: FileList | File[]) {
    const items: QueueItem[] = Array.from(files).map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
      kind: inferKind(file),
      progress: 0,
      status: 'queued',
    }));
    setQueue((prev) => [...prev, ...items]);
  }

  function updateItem(id: string, patch: Partial<QueueItem>) {
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function pollTranscodeStatus(itemId: string, jobId: string) {
    const interval = setInterval(async () => {
      try {
        const res = await getTranscodeStatus(jobId);
        if (res.status === 'completed') {
          updateItem(itemId, { 
            status: 'done', 
            transcodeStatus: 'completed', 
            transcodeProgress: 100, 
            url: res.hlsMasterPlaylistUrl 
          });
          clearInterval(interval);
          toast.success(`Video transcoding complete!`);
        } else if (res.status === 'failed') {
          updateItem(itemId, { 
            status: 'error', 
            transcodeStatus: 'failed', 
            error: res.error || 'Transcoding failed' 
          });
          clearInterval(interval);
          toast.error(`Video transcoding failed.`);
        } else {
          updateItem(itemId, { 
            transcodeStatus: res.status, 
            transcodeProgress: res.progress 
          });
        }
      } catch (err) {
        // Ignore polling fetch errors
      }
    }, 3000);
  }

  async function startUpload(item: QueueItem) {
    updateItem(item.id, { status: 'uploading', progress: 0 });
    try {
      const result = await uploadFile(item.kind, item.file, (percent) => updateItem(item.id, { progress: percent }));
      
      if (item.kind === 'video' && result.jobId) {
        updateItem(item.id, {
          status: 'transcoding',
          progress: 100,
          jobId: result.jobId,
          transcodeStatus: result.status || 'queued',
          transcodeProgress: 0,
          url: result.url,
        });
        
        pollTranscodeStatus(item.id, result.jobId);
      } else {
        updateItem(item.id, { status: 'done', progress: 100, url: result.url });
        toast.success(`${item.file.name} uploaded`);
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Upload failed';
      updateItem(item.id, { status: 'error', error: message });
      toast.error(`${item.file.name}: ${message}`);
    }
  }

  function uploadAllQueued() {
    queue.filter((i) => i.status === 'queued').forEach(startUpload);
  }

  function removeItem(id: string) {
    setQueue((prev) => prev.filter((i) => i.id !== id));
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }, []);

  function copyToClipboard(text: string | undefined) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success('HLS Master Playlist URL copied!');
  }

  return (
    <div className="space-y-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
          isDragging ? 'border-accent bg-accent/5' : 'border-border bg-surface hover:border-muted'
        }`}
      >
        <UploadCloud size={36} className={isDragging ? 'text-accent' : 'text-muted'} />
        <p className="mt-3 font-display text-lg uppercase tracking-wide text-text">Drag &amp; drop files here</p>
        <p className="mt-1 text-sm text-muted">or click to browse — video, poster, banner, or trailer files</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {queue.length > 0 && (
        <div className="rounded-lg border border-border bg-surface shadow-panel">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="font-display text-base uppercase tracking-wide text-text">
              Upload Queue <span className="font-mono text-xs text-muted">({queue.length})</span>
            </h2>
            <div className="flex items-center gap-4">
              <span className="font-mono text-[11px] text-muted">
                SESSION UPLOADED: {formatBytes(totalUploadedBytes)}
              </span>
              <button
                onClick={uploadAllQueued}
                disabled={!queue.some((i) => i.status === 'queued')}
                className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-40"
              >
                Upload All
              </button>
            </div>
          </div>

          <ul>
            {queue.map((item) => (
              <li key={item.id} className="flex items-center gap-4 border-b border-border/60 px-4 py-3 last:border-0">
                <div className="text-muted">
                  {item.kind === 'video' || item.kind === 'trailer' ? <FileVideo size={20} /> : <ImageIcon size={20} />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm text-text font-medium">{item.file.name}</p>
                    <span className="shrink-0 font-mono text-[11px] text-muted">{formatBytes(item.file.size)}</span>
                  </div>

                  <div className="mt-1.5 flex items-center gap-3">
                    <select
                      value={item.kind}
                      disabled={item.status !== 'queued'}
                      onChange={(e) => updateItem(item.id, { kind: e.target.value as UploadKind })}
                      className="rounded border border-border bg-surface2 px-1.5 py-0.5 text-[11px] text-muted disabled:opacity-50"
                    >
                      {KIND_OPTIONS.map((k) => (
                        <option key={k.value} value={k.value}>
                          {k.label}
                        </option>
                      ))}
                    </select>

                    {item.status === 'uploading' && (
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface2">
                        <div className="h-full bg-accent transition-all" style={{ width: `${item.progress}%` }} />
                      </div>
                    )}

                    {item.status === 'transcoding' && (
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-[10px] text-live font-semibold">
                          <span>Transcoding: {item.transcodeStatus}</span>
                          <span>{item.transcodeProgress}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface2">
                          <div className="h-full bg-live transition-all animate-pulse" style={{ width: `${item.transcodeProgress}%` }} />
                        </div>
                      </div>
                    )}

                    {item.status === 'error' && <span className="text-[11px] text-accent">{item.error}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.status === 'done' && (
                    <>
                      <button
                        title="Copy HLS URL"
                        onClick={() => copyToClipboard(item.url)}
                        className="rounded p-1 text-muted hover:text-text hover:bg-surface2"
                      >
                        <Copy size={14} />
                      </button>
                      <CheckCircle2 size={16} className="text-live" />
                    </>
                  )}
                  {item.status === 'error' && <AlertCircle size={16} className="text-accent" />}
                  {item.status === 'queued' && (
                    <button
                      onClick={() => startUpload(item)}
                      className="rounded-md border border-border px-2 py-1 text-[11px] text-muted hover:text-text hover:bg-surface2"
                    >
                      Start
                    </button>
                  )}
                  <button 
                    onClick={() => removeItem(item.id)} 
                    disabled={item.status === 'uploading' || item.status === 'transcoding'}
                    className="rounded p-1 text-muted hover:text-accent disabled:opacity-30"
                  >
                    <X size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="font-mono text-[11px] text-muted">
        Files upload directly to the API server. For movies and episodes, HLS adaptive transcoding (240p–1080p)
        happens in the background. Once transcoding finishes, you can copy the generated HLS Master Playlist URL
        using the copy button next to the checkmark, then paste it in the Movie/Episode fields.
      </p>
    </div>
  );
}
