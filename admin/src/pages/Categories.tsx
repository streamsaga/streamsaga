import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { listCategories, createCategory, updateCategory, deleteCategory } from '@/api/taxonomyApi';
import { Category } from '@/types';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function Categories() {
  const queryClient = useQueryClient();
  const { data: categories = [], isLoading } = useQuery({ queryKey: ['categories'], queryFn: listCategories });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState(0);
  const [deleting, setDeleting] = useState<Category | null>(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      editing ? updateCategory(editing._id, { name, description, order }) : createCategory({ name, description, order }),
    onSuccess: () => {
      toast.success(editing ? 'Category updated' : 'Category created');
      setFormOpen(false);
      invalidate();
    },
    onError: () => toast.error('Failed to save category'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      toast.success('Category deleted');
      setDeleting(null);
      invalidate();
    },
  });

  function openCreate() {
    setEditing(null);
    setName('');
    setDescription('');
    setOrder(categories.length);
    setFormOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setName(cat.name);
    setDescription(cat.description ?? '');
    setOrder(cat.order);
    setFormOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    saveMutation.mutate();
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus size={16} /> Add Category
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-panel">
        {isLoading && <p className="px-4 py-6 text-sm text-muted">Loading categories…</p>}
        {!isLoading && categories.length === 0 && <p className="px-4 py-6 text-sm text-muted">No categories yet.</p>}
        <ul>
          {categories.map((cat) => (
            <li key={cat._id} className="flex items-center justify-between border-b border-border/60 px-4 py-3 last:border-0">
              <div>
                <p className="text-sm font-medium text-text">{cat.name}</p>
                {cat.description && <p className="text-xs text-muted">{cat.description}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] text-muted">ORDER {cat.order}</span>
                <button onClick={() => openEdit(cat)} className="rounded p-1.5 text-muted hover:text-text">
                  <Pencil size={15} />
                </button>
                <button onClick={() => setDeleting(cat)} className="rounded p-1.5 text-muted hover:text-accent">
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit Category' : 'Add Category'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Input label="Display Order" type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saveMutation.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleting}
        title="Delete Category"
        message={`Delete "${deleting?.name}"?`}
        isLoading={deleteMutation.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting._id)}
      />
    </div>
  );
}
