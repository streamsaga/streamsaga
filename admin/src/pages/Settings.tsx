import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getSettings, updateSettings } from '@/api/dashboardApi';
import { Input, TextArea } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Settings as SettingsType } from '@/types';

const EMPTY: Omit<SettingsType, '_id'> = {
  siteName: '',
  siteDescription: '',
  logoUrl: '',
  supportEmail: '',
  maintenanceMode: false,
  allowRegistration: true,
};

export default function Settings() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['settings'], queryFn: getSettings });
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (data) {
      setForm({
        siteName: data.siteName,
        siteDescription: data.siteDescription,
        logoUrl: data.logoUrl,
        supportEmail: data.supportEmail,
        maintenanceMode: data.maintenanceMode,
        allowRegistration: data.allowRegistration,
      });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: () => updateSettings(form),
    onSuccess: () => {
      toast.success('Settings saved');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: () => toast.error('Failed to save settings'),
  });

  if (isLoading) return <div className="font-mono text-sm text-muted">Loading settings…</div>;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
      className="max-w-xl space-y-5 rounded-lg border border-border bg-surface p-6 shadow-panel"
    >
      <Input label="Site Name" value={form.siteName} onChange={(e) => setForm({ ...form, siteName: e.target.value })} />
      <TextArea
        label="Site Description"
        rows={3}
        value={form.siteDescription}
        onChange={(e) => setForm({ ...form, siteDescription: e.target.value })}
      />
      <Input label="Logo URL" value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} />
      <Input
        label="Support Email"
        type="email"
        value={form.supportEmail}
        onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
      />

      <div className="space-y-3 border-t border-border pt-4">
        <label className="flex items-center justify-between">
          <span className="text-sm text-text">Maintenance Mode</span>
          <input
            type="checkbox"
            checked={form.maintenanceMode}
            onChange={(e) => setForm({ ...form, maintenanceMode: e.target.checked })}
            className="h-4 w-4 accent-accent"
          />
        </label>
        <label className="flex items-center justify-between">
          <span className="text-sm text-text">Allow New Registrations</span>
          <input
            type="checkbox"
            checked={form.allowRegistration}
            onChange={(e) => setForm({ ...form, allowRegistration: e.target.checked })}
            className="h-4 w-4 accent-accent"
          />
        </label>
      </div>

      <Button type="submit" isLoading={mutation.isPending}>
        Save Settings
      </Button>
    </form>
  );
}
