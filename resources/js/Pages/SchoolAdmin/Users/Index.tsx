import { Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import {
    Search, MoreHorizontal, Eye, RotateCcw, ShieldCheck, Pencil, Trash2,
    Users, UserCheck, KeyRound, UserMinus, CheckCircle2, XCircle,
} from 'lucide-react';
import type { PageProps } from '@/Types';
import { useState } from 'react';

interface Props {
    users: {
        data: Array<{
            id: number;
            name: string;
            email: string | null;
            phone: string | null;
            username: string | null;
            status: string;
            is_temporary_password: boolean;
            must_change_password: boolean;
            last_login_at: string | null;
            created_at: string;
            roles: Array<{ id: number; name: string }>;
            avatar_url: string | null;
        }>;
        meta: { total: number; current_page: number; last_page: number; from: number | null; to: number | null };
        links: { prev: string | null; next: string | null };
    };
    roles: string[];
    filters: { search?: string; role?: string; status?: string };
    stats: { total: number; active: number; temp_pwd: number; inactive: number };
}

const statusColors: Record<string, string> = {
    active:   'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300',
    inactive: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

const statusLabels: Record<string, string> = {
    active: 'Active', inactive: 'Inactive',
};

export default function UsersIndex({ users, roles, filters, stats }: Props) {
    const { flash } = usePage<PageProps>().props;
    const [search, setSearch] = useState(filters.search ?? '');

    function applyFilter(key: string, value: string) {
        router.get('/school/users', { ...filters, [key]: value || undefined, page: undefined }, { preserveScroll: true, preserveState: true });
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        applyFilter('search', search);
    }

    function handleToggleStatus(user: { id: number; name: string }) {
        if (!confirm(`Toggle status for "${user.name}"?`)) return;
        router.post(`/school/users/${user.id}/toggle-status`);
    }

    function handleResetPassword(user: { id: number; name: string }) {
        if (!confirm(`Reset password for "${user.name}"?`)) return;
        router.post(`/school/users/${user.id}/reset-password`);
    }

    const statCards = [
        { label: 'Total Users',   value: stats.total,    icon: Users,     color: 'text-indigo-600' },
        { label: 'Active',        value: stats.active,   icon: UserCheck, color: 'text-green-600' },
        { label: 'Temp Password', value: stats.temp_pwd, icon: KeyRound,  color: 'text-amber-600' },
        { label: 'Inactive',      value: stats.inactive, icon: UserMinus, color: 'text-slate-500' },
    ];

    return (
        <AppLayout title="Users">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Users</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{stats.total} users registered</p>
                    </div>
                </div>

                {flash?.success && (
                    <div className="rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-300">
                        {flash.success}
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {statCards.map(({ label, value, icon: Icon, color }) => (
                        <Card key={label} className="border-slate-200 dark:border-slate-800">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-800 ${color}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                className="pl-9"
                                placeholder="Search by name, email, username..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <Button type="submit" variant="outline">Search</Button>
                    </form>

                    <Select value={filters.role ?? ''} onValueChange={v => applyFilter('role', v)}>
                        <SelectTrigger className="w-44"><SelectValue placeholder="All Roles" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Roles</SelectItem>
                            {(roles ?? []).map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={filters.status ?? ''} onValueChange={v => applyFilter('status', v)}>
                        <SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 dark:bg-slate-900">
                                <TableHead>User</TableHead>
                                <TableHead className="hidden sm:table-cell">Username</TableHead>
                                <TableHead className="hidden md:table-cell">Roles</TableHead>
                                <TableHead className="hidden md:table-cell">Temp Password</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="hidden lg:table-cell">Last Login</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(users?.data ?? []).length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-16 text-slate-400">
                                        <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            ) : (users?.data ?? []).map((u) => (
                                <TableRow key={u.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            {u.avatar_url ? (
                                                <img src={u.avatar_url} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                                    {u.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white text-sm">{u.name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{u.email ?? '—'}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell font-mono text-xs text-slate-600 dark:text-slate-400">{u.username ?? '—'}</TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <div className="flex flex-wrap gap-1">
                                            {(u.roles ?? []).length === 0 ? (
                                                <span className="text-xs text-slate-400">—</span>
                                            ) : (u.roles ?? []).map(role => (
                                                <Badge key={role.id} variant="secondary" className="text-xs">
                                                    {role.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        {u.is_temporary_password ? (
                                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                                                <KeyRound className="w-3.5 h-3.5" /> Yes
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                                                <XCircle className="w-3.5 h-3.5" /> No
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`border-0 ${statusColors[u.status] ?? ''}`}>
                                            {statusLabels[u.status] ?? u.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell text-slate-600 dark:text-slate-400 text-sm">
                                        {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : '—'}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="w-8 h-8">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/school/users/${u.id}`} className="flex items-center gap-2 text-sm">
                                                        <Eye className="w-4 h-4" /> View
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/school/users/${u.id}/edit`} className="flex items-center gap-2 text-sm">
                                                        <Pencil className="w-4 h-4" /> Edit
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleToggleStatus(u)} className="flex items-center gap-2 text-sm">
                                                    <ShieldCheck className="w-4 h-4" /> Toggle Status
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleResetPassword(u)} className="flex items-center gap-2 text-sm">
                                                    <RotateCcw className="w-4 h-4" /> Reset Password
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => {
                                                    if (confirm(`Delete "${u.name}"? This cannot be undone.`)) {
                                                        router.delete(`/school/users/${u.id}`);
                                                    }
                                                }} className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                                    <Trash2 className="w-4 h-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {users?.meta?.last_page > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Showing {users?.meta?.from ?? '?'}–{users?.meta?.to ?? '?'} of {users?.meta?.total ?? 0}
                            </p>
                            <div className="flex gap-2">
                                {users.links.prev && (
                                    <Link href={users.links.prev} preserveScroll>
                                        <Button variant="outline" size="sm">Previous</Button>
                                    </Link>
                                )}
                                {users.links.next && (
                                    <Link href={users.links.next} preserveScroll>
                                        <Button variant="outline" size="sm">Next</Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
