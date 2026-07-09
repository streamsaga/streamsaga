import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: boolean;
}

export default function StatCard({ label, value, icon: Icon, accent }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-panel">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted">{label}</p>
          <p className={`mt-2 font-display text-3xl ${accent ? 'text-accent' : 'text-text'}`}>{value}</p>
        </div>
        <div className={`rounded-md p-2 ${accent ? 'bg-accent/10 text-accent' : 'bg-surface2 text-muted'}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}
