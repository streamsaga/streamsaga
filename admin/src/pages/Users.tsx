import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Trash2, ShieldCheck, ShieldOff, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { listUsers, updateUserRole, toggleUserActive, deleteUser, createUser, CreateUserPayload } from '@/api/userApi';
import { User, UserRole } from '@/types';
import Pagination from '@/components/ui/Pagination';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Modal from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const ROLES: UserRole[] = ['user', 'admin', 'superadmin'];

const EMPTY_CREATE: CreateUserPayload = {
  name: '',
  email: '',
  password: '',
  role: 'user',
};

export default function Users() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<User | null>(null);
  
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserPayload>(EMPTY_CREATE);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search],
    queryFn: () => listUsers({ page, limit: 10, search: search || undefined }),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  }

  const createMutation = useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: () => {
      toast.success('User created successfully');
      setCreateOpen(false);
      setCreateForm(EMPTY_CREATE);
      invalidate();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to create user';
      toast.error(msg);
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) => updateUserRole(id, role),
    onSuccess: () => {
      toast.success('Role updated');
      invalidate();
    },
  });

  const activeMutation = useMutation({ mutationFn: (id: string) => toggleUserActive(id), onSuccess: invalidate });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      toast.success('User deleted');
      setDeleting(null);
      invalidate();
    },
  });

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password?.trim()) {
      toast.error('All fields are required');
      return;
    }
    createMutation.mutate(createForm);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search users by name or email…"
            className="w-full rounded-md border border-border bg-surface2 py-2 pl-9 pr-3 text-sm text-text placeholder:text-muted/60 focus:border-accent focus:outline-none"
          />
        </div>
        <Button onClick={() => {
          setCreateForm(EMPTY_CREATE);
          setCreateOpen(true);
        }}>
          <Plus size={16} /> Add User
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-panel">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface2 font-mono text-[11px] uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">
                  Loading users…
                </td>
              </tr>
            )}
            {!isLoading && data?.users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  No users found.
                </td>
              </tr>
            )}
            {data?.users.map((user) => (
              <tr key={user._id} className="border-b border-border/60 last:border-0 hover:bg-surface2/50">
                <td className="px-4 py-3 font-medium text-text">{user.name}</td>
                <td className="px-4 py-3 text-muted">{user.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    onChange={(e) => roleMutation.mutate({ id: user._id, role: e.target.value as UserRole })}
                    className="rounded-md border border-border bg-surface2 px-2 py-1 text-xs text-text focus:border-accent focus:outline-none"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase ${
                      user.isActive ? 'border-live/40 text-live' : 'border-draft/40 text-draft'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? 'bg-live' : 'bg-draft'}`} />
                    {user.isActive ? 'Active' : 'Suspended'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <button
                      title={user.isActive ? 'Suspend user' : 'Reactivate user'}
                      onClick={() => activeMutation.mutate(user._id)}
                      className="rounded p-1.5 text-muted hover:text-text"
                    >
                      {user.isActive ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}
                    </button>
                    <button
                      title="Delete user"
                      onClick={() => setDeleting(user)}
                      className="rounded p-1.5 text-muted hover:text-accent"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onChange={setPage} />}
      </div>

      <ConfirmDialog
        isOpen={!!deleting}
        title="Delete User"
        message={`Delete "${deleting?.name}"? This cannot be undone.`}
        isLoading={deleteMutation.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting._id)}
      />

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Add New User" size="md">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Name"
            required
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            placeholder="Full Name"
          />
          <Input
            label="Email"
            type="email"
            required
            value={createForm.email}
            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            placeholder="email@example.com"
          />
          <Input
            label="Password"
            type="password"
            required
            value={createForm.password || ''}
            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
            placeholder="Min 8 characters"
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted">Role</label>
            <select
              value={createForm.role}
              onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as UserRole })}
              className="w-full rounded-md border border-border bg-surface2 px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
