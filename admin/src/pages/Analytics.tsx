import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '@/api/dashboardApi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import StatCard from '@/components/ui/StatCard';
import { Film, Tv, Users } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  Published: '#2FBF71',
  Draft: '#5C6370',
  Processing: '#E5A93E',
};

export default function Analytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    staleTime: 0,
    refetchInterval: 30_000, // Auto-refresh every 30 seconds
  });

  if (isLoading || !data) {
    return <div className="font-mono text-sm text-muted">Loading analytics…</div>;
  }

  const statusData = [
    { name: 'Published', value: data.totals.publishedMovies },
    { name: 'Draft', value: data.totals.draftMovies },
    { name: 'Processing', value: data.totals.processingMovies },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Movies" value={data.totals.totalMovies} icon={Film} />
        <StatCard label="Total Series" value={data.totals.totalSeries} icon={Tv} />
        <StatCard label="Registered Users" value={data.totals.totalUsers} icon={Users} />
      </div>

      <div className="rounded-lg border border-border bg-surface p-5 shadow-panel">
        <h2 className="mb-4 font-display text-lg uppercase tracking-wide text-text">Content Pipeline Breakdown</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={statusData} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid stroke="#262B33" strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" stroke="#8B92A0" fontSize={11} allowDecimals={false} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="name" stroke="#8B92A0" fontSize={12} tickLine={false} axisLine={false} width={90} />
            <Tooltip
              contentStyle={{ background: '#1C2027', border: '1px solid #262B33', borderRadius: 8, fontSize: 12 }}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={28}>
              {statusData.map((entry) => (
                <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg border border-border bg-surface p-5 shadow-panel">
        <h2 className="mb-4 font-display text-lg uppercase tracking-wide text-text">Most Watched</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.topMovies.map((m) => ({ name: m.title, views: m.views }))}>
            <CartesianGrid stroke="#262B33" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" stroke="#8B92A0" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#8B92A0" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ background: '#1C2027', border: '1px solid #262B33', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="views" fill="#E5342E" radius={[4, 4, 0, 0]} barSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
