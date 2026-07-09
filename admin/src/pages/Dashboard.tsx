import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '@/api/dashboardApi';
import StatCard from '@/components/ui/StatCard';
import { Film, Tv, Users, CheckCircle2, Clock, Loader2, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Dashboard() {
  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    staleTime: 0,
    refetchInterval: 30_000, // Auto-refresh every 30 seconds
  });

  if (isLoading) {
    return <div className="font-mono text-sm text-muted">Loading dashboard…</div>;
  }

  const totals = data?.totals;
  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '—';

  return (
    <div className="space-y-6">
      {/* Header row with manual refresh */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted font-mono">Last updated: {lastUpdated}</p>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-text border border-border/50 hover:border-border rounded-md px-2.5 py-1.5 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${isFetching ? 'animate-spin text-accent' : ''}`} />
          {isFetching ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Movies" value={totals?.totalMovies ?? 0} icon={Film} />
        <StatCard label="Series" value={totals?.totalSeries ?? 0} icon={Tv} />
        <StatCard label="Users" value={totals?.totalUsers ?? 0} icon={Users} />
        <StatCard label="Published" value={totals?.publishedMovies ?? 0} icon={CheckCircle2} accent />
        <StatCard label="Drafts" value={totals?.draftMovies ?? 0} icon={Clock} />
        <StatCard label="Processing" value={totals?.processingMovies ?? 0} icon={Loader2} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-5 shadow-panel lg:col-span-2">
          <h2 className="mb-4 font-display text-lg uppercase tracking-wide text-text">Signups &middot; Last 14 Days</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data?.signupTrend ?? []}>
              <defs>
                <linearGradient id="signupGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E5342E" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#E5342E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#262B33" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" stroke="#8B92A0" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#8B92A0" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#1C2027', border: '1px solid #262B33', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#8B92A0' }}
              />
              <Area type="monotone" dataKey="count" stroke="#E5342E" fill="url(#signupGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-border bg-surface p-5 shadow-panel">
          <h2 className="mb-4 font-display text-lg uppercase tracking-wide text-text">Top Titles</h2>
          <ul className="space-y-3">
            {(data?.topMovies ?? []).length === 0 && <p className="text-sm text-muted">No published titles yet.</p>}
            {data?.topMovies.map((m, i) => (
              <li key={m._id} className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted">{String(i + 1).padStart(2, '0')}</span>
                <span className="flex-1 truncate text-sm text-text">{m.title}</span>
                <span className="font-mono text-xs text-accent">{m.views.toLocaleString()} views</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}


