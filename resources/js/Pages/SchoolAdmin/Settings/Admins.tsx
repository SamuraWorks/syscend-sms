import AppLayout from '@/Layouts/AppLayout';
import { useForm, router } from '@inertiajs/react';
import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
    UserCog, Plus, Search, Edit, Trash2, Ban, CheckCircle, ChevronLeft, ChevronRight,
    Upload, Download, Key, Users, ShieldCheck, AlertTriangle, Loader2, Copy, Check,
} from 'lucide-react';

interface Role { name: string; }
interface UserRow {
    id: number; name: string; email: string; phone: string | null;
    status: string; roles: Role[]; created_at: string; last_login_at: string | null;
}
interface Meta { total: number; per_page: number; current_page: number; last_page: number; }
interface Props {
    users: { data: UserRow[]; meta: Meta };
    roles: string[];
    filters: { search?: string; role?: string; status?: string };
    stats: {
        total: number; active: number; inactive: number; suspended: number;
        roles: Record<string, number>;
    };
}

const STATUSES = ['active', 'inactive', 'suspended'];

const statusBadge = (status: string) => {
    const map: Record<string, string> = {
        active:    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        inactive:  'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
        suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[status] ?? ''}`}>{status}</span>;
};

const roleLabel = (name: string) => name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export default function Admins({ users, roles, filters, stats }: Props) {
    const [search, setSearch]           = useState(filters.search ?? '');
    const [roleFilter, setRoleFilter]   = useState(filters.role ?? '');
    const [statusFilter, setStatusFilter] = useState(filters.status ?? '');

    const [showModal, setShowModal]   = useState(false);
    const [editUser, setEditUser]     = useState<UserRow | null>(null);
    const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);

    const [selected, setSelected]     = useState<number[]>([]);
    const [showBulkDialog, setShowBulkDialog] = useState(false);
    const [bulkAction, setBulkAction] = useState<'activate' | 'suspend' | 'delete'>('activate');

    const [showImportDialog, setShowImportDialog] = useState(false);
    const importForm = useForm({ csv_file: null as File | null, default_role: 'teacher' });
    const fileRef = useRef<HTMLInputElement>(null);

    const [resetResult, setResetResult] = useState<{ user: string; password: string } | null>(null);
    const [createdResult, setCreatedResult] = useState<{ name: string; email: string; temp_password: string; roles: string[] } | null>(null);
    const [copied, setCopied] = useState(false);

    const form = useForm({
        name: '', email: '', phone: '', password: '',
        roles: [] as string[], status: 'active',
    });

    function applyFilters(overrides: Record<string, string> = {}) {
        router.get('/school/settings/admins', {
            search: search, role: roleFilter, status: statusFilter, ...overrides,
        }, { preserveState: true, replace: true });
    }

    function openCreate() {
        form.reset();
        form.setData({ name: '', email: '', phone: '', password: '', roles: [], status: 'active' });
        form.clearErrors();
        setEditUser(null);
        setShowModal(true);
    }

    function openEdit(u: UserRow) {
        form.setData({
            name: u.name, email: u.email, phone: u.phone ?? '',
            password: '', roles: u.roles.map(r => r.name), status: u.status,
        });
        form.clearErrors();
        setEditUser(u);
        setShowModal(true);
    }

    function submitForm(e: React.FormEvent) {
        e.preventDefault();
        if (editUser) {
            form.put(`/school/settings/admins/${editUser.id}`, { onSuccess: () => setShowModal(false) });
        } else {
            form.post('/school/settings/admins', {
                onSuccess: (page: any) => {
                    setShowModal(false);
                    const flash = page.props?.user_created;
                    if (flash) setCreatedResult(flash);
                },
            });
        }
    }

    function confirmDelete() {
        if (!deleteUser) return;
        router.delete(`/school/settings/admins/${deleteUser.id}`, { onSuccess: () => setDeleteUser(null) });
    }

    function toggleStatus(u: UserRow) {
        const action = u.status === 'suspended' ? 'activate' : 'suspend';
        router.patch(`/school/settings/admins/${u.id}/${action}`);
    }

    function resetPassword(u: UserRow) {
        router.post(`/school/settings/admins/${u.id}/reset-password`, {}, {
            onSuccess: (page: any) => {
                const flash = page.props?.reset_password;
                if (flash) setResetResult(flash);
            },
        });
    }

    function toggleRole(roleName: string) {
        const current = form.data.roles;
        if (current.includes(roleName)) {
            form.setData('roles', current.filter(r => r !== roleName));
        } else {
            form.setData('roles', [...current, roleName]);
        }
    }

    function copyPassword(pwd: string) {
        navigator.clipboard.writeText(pwd);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    function toggleSelect(id: number) {
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    }
    function toggleSelectAll() {
        if (selected.length === users.data.length) { setSelected([]); }
        else { setSelected(users.data.map(u => u.id)); }
    }
    function executeBulk() {
        const url = `/school/settings/admins/bulk/${bulkAction}`;
        router.post(url, { ids: selected }, { onSuccess: () => { setSelected([]); setShowBulkDialog(false); } });
    }

    function submitImport(e: React.FormEvent) {
        e.preventDefault();
        if (!importForm.data.csv_file) return;
        importForm.post('/school/settings/admins/bulk/import', {
            onSuccess: () => { setShowImportDialog(false); importForm.reset(); },
            forceFormData: true,
        });
    }

    return (
        <AppLayout title="User Management">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">User Management</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Manage staff accounts, roles and access within your school</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => router.get('/school/settings/admins/export')} className="gap-2">
                            <Download className="w-4 h-4" /> Export CSV
                        </Button>
                        <Button variant="outline" onClick={() => setShowImportDialog(true)} className="gap-2">
                            <Upload className="w-4 h-4" /> Import CSV
                        </Button>
                        <Button onClick={openCreate} className="gap-2">
                            <Plus className="w-4 h-4" /> Add User
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Users', value: stats.total, icon: Users, color: 'text-primary' },
                        { label: 'Active', value: stats.active, icon: CheckCircle, color: 'text-green-600' },
                        { label: 'Inactive', value: stats.inactive, icon: ShieldCheck, color: 'text-slate-500' },
                        { label: 'Suspended', value: stats.suspended, icon: AlertTriangle, color: 'text-red-500' },
                    ].map(s => (
                        <Card key={s.label}>
                            <CardContent className="pt-5 flex items-center gap-4">
                                <div className={cn('w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0')}>
                                    <s.icon className={cn('w-5 h-5', s.color)} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{s.value}</p>
                                    <p className="text-xs text-muted-foreground">{s.label}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex flex-wrap gap-3">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input className="pl-9" placeholder="Search name or email..."
                                    value={search} onChange={e => setSearch(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && applyFilters({ search })}
                                />
                            </div>
                            <Select value={roleFilter || '_all'} onValueChange={v => { setRoleFilter(v === '_all' ? '' : v); applyFilters({ role: v === '_all' ? '' : v }); }}>
                                <SelectTrigger className="w-44"><SelectValue placeholder="All Roles" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_all">All Roles</SelectItem>
                                    {roles.map(r => <SelectItem key={r} value={r}>{roleLabel(r)}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter || '_all'} onValueChange={v => { setStatusFilter(v === '_all' ? '' : v); applyFilters({ status: v === '_all' ? '' : v }); }}>
                                <SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_all">All Status</SelectItem>
                                    {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Button variant="outline" onClick={() => applyFilters({ search })}>Search</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Bulk action bar */}
                {selected.length > 0 && (
                    <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
                        <span className="text-sm font-medium">{selected.length} selected</span>
                        <Button size="sm" variant="outline" onClick={() => { setBulkAction('activate'); setShowBulkDialog(true); }}>
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Activate
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setBulkAction('suspend'); setShowBulkDialog(true); }}>
                            <Ban className="w-3.5 h-3.5 mr-1" /> Suspend
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600" onClick={() => { setBulkAction('delete'); setShowBulkDialog(true); }}>
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setSelected([])}>Clear</Button>
                    </div>
                )}

                {/* Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <UserCog className="w-4 h-4 text-primary" />
                            School Users ({users.meta.total})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border text-muted-foreground text-xs uppercase">
                                        <th className="py-3 px-4 w-10">
                                            <input type="checkbox"
                                                checked={selected.length === users.data.length && users.data.length > 0}
                                                onChange={toggleSelectAll}
                                                className="rounded border-border" />
                                        </th>
                                        <th className="text-left py-3 px-4 font-medium">Name</th>
                                        <th className="text-left py-3 px-4 font-medium">Email</th>
                                        <th className="text-left py-3 px-4 font-medium">Phone</th>
                                        <th className="text-left py-3 px-4 font-medium">Roles</th>
                                        <th className="text-left py-3 px-4 font-medium">Status</th>
                                        <th className="text-left py-3 px-4 font-medium">Last Login</th>
                                        <th className="text-right py-3 px-4 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.data.length === 0 && (
                                        <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">No users found.</td></tr>
                                    )}
                                    {users.data.map(u => (
                                        <tr key={u.id} className={cn('border-b border-border/50 hover:bg-accent/50 transition-colors', selected.includes(u.id) && 'bg-primary/5')}>
                                            <td className="py-3 px-4">
                                                <input type="checkbox" checked={selected.includes(u.id)}
                                                    onChange={() => toggleSelect(u.id)} className="rounded border-border" />
                                            </td>
                                            <td className="py-3 px-4 font-medium">{u.name}</td>
                                            <td className="py-3 px-4 text-muted-foreground">{u.email}</td>
                                            <td className="py-3 px-4 text-muted-foreground">{u.phone ?? '—'}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {u.roles.length > 0
                                                        ? u.roles.map(r => (
                                                            <Badge key={r.name} variant="outline" className="text-xs">{roleLabel(r.name)}</Badge>
                                                        ))
                                                        : <span className="text-muted-foreground">—</span>}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">{statusBadge(u.status)}</td>
                                            <td className="py-3 px-4 text-muted-foreground text-xs">
                                                {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : '—'}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => resetPassword(u)} title="Reset Password"
                                                        className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-amber-600">
                                                        <Key className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => toggleStatus(u)}
                                                        title={u.status === 'suspended' ? 'Activate' : 'Suspend'}
                                                        className={cn('p-1.5 rounded hover:bg-accent', u.status === 'suspended' ? 'text-green-500' : 'text-amber-500')}>
                                                        {u.status === 'suspended' ? <CheckCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                                                    </button>
                                                    <button onClick={() => openEdit(u)} title="Edit"
                                                        className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-primary">
                                                        <Edit className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => setDeleteUser(u)} title="Delete"
                                                        className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-red-600">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {users.meta.last_page > 1 && (
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                                <p className="text-sm text-muted-foreground">
                                    Page {users.meta.current_page} of {users.meta.last_page} — {users.meta.total} users
                                </p>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" disabled={users.meta.current_page <= 1}
                                        onClick={() => applyFilters({ page: String(users.meta.current_page - 1) })}>
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" disabled={users.meta.current_page >= users.meta.last_page}
                                        onClick={() => applyFilters({ page: String(users.meta.current_page + 1) })}>
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Create / Edit Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editUser ? 'Edit User' : 'Add User'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitForm} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Name *</Label>
                                <Input value={form.data.name} onChange={e => form.setData('name', e.target.value)} />
                                {form.errors.name && <p className="text-xs text-red-500 mt-1">{form.errors.name}</p>}
                            </div>
                            <div>
                                <Label>Email *</Label>
                                <Input type="email" value={form.data.email} onChange={e => form.setData('email', e.target.value)} />
                                {form.errors.email && <p className="text-xs text-red-500 mt-1">{form.errors.email}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Phone</Label>
                                <Input value={form.data.phone} onChange={e => form.setData('phone', e.target.value)} placeholder="+232..." />
                            </div>
                            <div>
                                <Label>{editUser ? 'New Password' : 'Password'}</Label>
                                <Input type="password" value={form.data.password}
                                    onChange={e => form.setData('password', e.target.value)}
                                    placeholder={editUser ? 'Leave blank to keep' : 'Auto-generated if empty'} />
                                {form.errors.password && <p className="text-xs text-red-500 mt-1">{form.errors.password}</p>}
                            </div>
                        </div>
                        <div>
                            <Label>Roles * (select one or more)</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {roles.map(r => {
                                    const active = form.data.roles.includes(r);
                                    return (
                                        <button key={r} type="button" onClick={() => toggleRole(r)}
                                            className={cn(
                                                'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                                                active
                                                    ? 'bg-primary text-primary-foreground border-primary'
                                                    : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                                            )}>
                                            {roleLabel(r)}
                                        </button>
                                    );
                                })}
                            </div>
                            {form.errors.roles && <p className="text-xs text-red-500 mt-1">{form.errors.roles}</p>}
                        </div>
                        <div>
                            <Label>Status *</Label>
                            <Select value={form.data.status} onValueChange={v => form.setData('status', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                            <Button type="submit" disabled={form.processing || form.data.roles.length === 0}>
                                {editUser ? 'Save Changes' : 'Create User'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm */}
            <Dialog open={!!deleteUser} onOpenChange={open => !open && setDeleteUser(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Are you sure you want to delete <strong>{deleteUser?.name}</strong>? This cannot be undone.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteUser(null)}>Cancel</Button>
                        <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Confirm */}
            <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Bulk {bulkAction === 'activate' ? 'Activate' : bulkAction === 'suspend' ? 'Suspend' : 'Delete'}</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        {bulkAction === 'delete'
                            ? `This will permanently delete ${selected.length} users. This cannot be undone.`
                            : `This will ${bulkAction} ${selected.length} users.`}
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowBulkDialog(false)}>Cancel</Button>
                        <Button onClick={executeBulk}
                            className={bulkAction === 'delete' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}>
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* User Created — Temporary Password Display */}
            <Dialog open={!!createdResult} onOpenChange={open => !open && setCreatedResult(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" /> User Created</DialogTitle>
                    </DialogHeader>
                    {createdResult && (
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                Account created for <strong>{createdResult.name}</strong> ({createdResult.email})
                            </p>
                            <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-3">
                                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-1">Temporary password:</p>
                                <div className="flex items-center gap-2">
                                    <p className="font-mono text-sm font-bold text-amber-900 dark:text-amber-300 select-all">{createdResult.temp_password}</p>
                                    <button type="button" onClick={() => copyPassword(createdResult.temp_password)}
                                        className="p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400">
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                <span className="text-xs text-muted-foreground">Assigned roles:</span>
                                {createdResult.roles.map(r => (
                                    <Badge key={r} variant="outline" className="text-xs">{roleLabel(r)}</Badge>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                The user will be forced to change this password on first login.
                            </p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setCreatedResult(null)}>Done</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Password Reset Result */}
            <Dialog open={!!resetResult} onOpenChange={open => !open && setResetResult(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Key className="w-5 h-5" /> Password Reset</DialogTitle>
                    </DialogHeader>
                    {resetResult && (
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                Password for <strong>{resetResult.user}</strong> has been reset.
                            </p>
                            <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-3">
                                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-1">New temporary password:</p>
                                <div className="flex items-center gap-2">
                                    <p className="font-mono text-sm font-bold text-amber-900 dark:text-amber-300 select-all">{resetResult.password}</p>
                                    <button type="button" onClick={() => copyPassword(resetResult.password)}
                                        className="p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400">
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                The user will be forced to change this password on next login.
                            </p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setResetResult(null)}>Done</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Import CSV */}
            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Upload className="w-5 h-5" /> Import Users from CSV</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitImport} className="space-y-4">
                        <div className="rounded-lg border border-border bg-accent/50 p-4 text-sm text-muted-foreground">
                            <p className="font-medium mb-2">CSV Format Requirements:</p>
                            <ul className="space-y-1 list-disc list-inside">
                                <li><strong>name</strong> (required) — Full name</li>
                                <li><strong>email</strong> (required) — Unique email address</li>
                                <li><strong>phone</strong> (optional) — Phone number</li>
                                <li><strong>role</strong> (optional) — Defaults to the selected role below</li>
                            </ul>
                            <p className="mt-2 text-xs">Passwords are auto-generated and users are forced to change them on first login.</p>
                        </div>
                        <div>
                            <Label>CSV File *</Label>
                            <Input ref={fileRef} type="file" accept=".csv,.txt"
                                onChange={e => importForm.setData('csv_file', e.target.files?.[0] ?? null)} />
                            {importForm.errors.csv_file && <p className="text-xs text-red-500 mt-1">{importForm.errors.csv_file}</p>}
                        </div>
                        <div>
                            <Label>Default Role *</Label>
                            <Select value={importForm.data.default_role} onValueChange={v => importForm.setData('default_role', v)}>
                                <SelectTrigger><SelectValue placeholder="Select default role" /></SelectTrigger>
                                <SelectContent>
                                    {roles.map(r => <SelectItem key={r} value={r}>{roleLabel(r)}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">Applied to rows that don't specify a role.</p>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowImportDialog(false)}>Cancel</Button>
                            <Button type="submit" disabled={importForm.processing || !importForm.data.csv_file}>
                                {importForm.processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Import
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
