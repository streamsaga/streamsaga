import { ContentStatus } from '@/types';

const CONFIG: Record<ContentStatus, { label: string; dot: string; text: string }> = {
  published: { label: 'Live', dot: 'bg-live shadow-[0_0_8px_rgba(47,191,113,0.7)]', text: 'text-live' },
  processing: { label: 'Processing', dot: 'bg-processing animate-pulse', text: 'text-processing' },
  draft: { label: 'Draft', dot: 'bg-draft', text: 'text-muted' },
  failed: { label: 'Failed', dot: 'bg-accent', text: 'text-accent' },
};

export default function StatusBadge({ status }: { status: ContentStatus }) {
  const cfg = CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-surface2 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider ${cfg.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
