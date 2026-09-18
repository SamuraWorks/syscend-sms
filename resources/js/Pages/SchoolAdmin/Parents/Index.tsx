import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Search, Users, Eye, Pencil, Trash2, MoreHorizontal, Upload, UploadCloud, KeyRound, Copy, CheckCircle2 } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import ImportUploadDialog from '@/components/ImportUploadDialog';
import type { PageProps, FlatPaginatedResponse } from '@/Types';

interface Guardian {
    id: number;
    name: string;
    relation: string;
    phone: string | null;
    alt_phone: string | null;
    email: string | null;
    registration_status: string;
    children_count: number;
    user: { id: number; name: string; email: string } | null;
    created_at: string;
}

interface Props extends PageProps {
    parents: FlatPaginatedResponse<Guardian>;
    filters: { search?: string; status?: string };
    stats: { total: number; registered: number; pending: number; linked: number };
}

const statusBadge = (status: string) => {
    const map: Record<string, string> = {
        registered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
        pending:    'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? map.pending}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
};

export default function ParentsIndex() {
    const { parents, filters, stats, flash } = usePage<Props>().props;
    const [search, setSearch] = useState(filters.search ?? '');
    const [importOpen, setImportOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const confirmDelete = (p: Guardian) => {
        if (confirm(`Remove parent "${p.name}"? Their linked students will be unlinked.`)) {
            router.delete(`/school-admin/parents/${p.id}`);
        }
    };

    const copyCredentials = () => {
        if (!flash?.temp_password) return;
        navigator.clipboard.writeText(
            `Login: ${window.location.origin}/login\nPassword: ${flash.temp_password}\n\nPlease change your password after first login.`
        );
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const applyFilter = (params: Record<string, string>) =>
        router.get('/school-admin/parents', { ...filters, ...params }, { preserveState: true, replace: true });

    return (
        <AppLayout breadcrumbs={[{ label: 'Parents' }]}>
            <Head title="Parents" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Parents & Guardians</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Manage parent accounts and link children</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} className="inline-flex items-center gap-2">
                        <UploadCloud className="w-4 h-4" /> Import CSV
                    </Button>
                    <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white inline-flex items-center gap-2">
                        <Link href="/school-admin/parents/create"><Plus className="w-4 h-4" /> Add Parent</Link>
                    </Button>
                </div>
            </div>

            {flash?.error && (
                <div className="mb-4 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                    {flash.error}
                </div>
            )}

            {/* One-time parent credentials (after account creation / password reset) */}
            {flash?.temp_password && (
                <div className="mb-4 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                                <KeyRound className="w-5 h-5" />
                                <h3 className="font-semibold text-sm">
                                    {flash.parent_name ? `Parent Credentials — ${flash.parent_name}` : 'Temporary Credentials'}
                                </h3>
                            </div>
                            <p className="text-xs text-amber-600/80 dark:text-amber-400/80">
                                Shown only once. Share it securely with the parent — they must change it at first login.
                            </p>
                            <div className="flex items-center gap-2 font-mono text-sm text-slate-900 dark:text-white select-all">
                                <span className="text-xs font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">Password</span>
                                <span>{flash.temp_password}</span>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={copyCredentials} className="shrink-0 inline-flex items-center gap-1.5 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30">
                            {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copied' : 'Copy'}
                        </Button>
                    </div>
                </div>
            )}

            {flash?.success && !flash?.temp_password && (
                <div className="mb-4 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-300 inline-flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" /> {flash.success}
                </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total',       value: stats.total,       color: 'text-slate-800 dark:text-slate-100' },
                    { label: 'Registered',  value: stats.registered,  color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'Pending',     value: stats.pending,     color: 'text-amber-600 dark:text-amber-400' },
                    { label: 'With Children', value: stats.linked,    color: 'text-blue-600 dark:text-blue-400' },
                ].map((s) => (
                    <div key={s.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                        <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
                        <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                <div className="flex flex-wrap items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-800">
                    <form onSubmit={(e) => { e.preventDefault(); applyFilter({ search }); }} className="flex items-center gap-2 flex-1 min-w-52 max-w-sm">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input placeholder="Search name / phone / email…" className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                        <Button type="submit" size="sm" variant="secondary">Search</Button>
                    </form>
                    <Select value={filters.status ?? 'all'} onValueChange={(v) => applyFilter({ status: v === 'all' ? '' : v })}>
                        <SelectTrigger className="w-36 h-9"><SelectValue placeholder="All status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All status</SelectItem>
                            <SelectItem value="registered">Registered</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead>Parent</TableHead>
                            <TableHead className="hidden sm:table-cell">Relation</TableHead>
                            <TableHead className="hidden md:table-cell">Contact</TableHead>
                            <TableHead>Children</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-10" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {parents.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                                    <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">No parents found</p>
                                </TableCell>
                            </TableRow>
                        ) : parents.data.map((p) => (
                            <TableRow key={p.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center shrink-0 text-xs font-bold text-green-600 dark:text-green-400">
                                            {(p.name?.[0] ?? '?').toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white text-sm">{p.name}</p>
                                            {p.user && <p className="text-xs text-slate-400">Account active</p>}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell text-sm text-slate-600 dark:text-slate-400 capitalize">{p.relation}</TableCell>
                                <TableCell className="hidden md:table-cell text-sm text-slate-600 dark:text-slate-400">
                                    {p.phone ?? '—'}
                                    {p.email && <p className="text-xs text-slate-400 truncate max-w-[180px]">{p.email}</p>}
                                </TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
                                        {p.children_count} {p.children_count === 1 ? 'child' : 'children'}
                                    </span>
                                </TableCell>
                                <TableCell>{statusBadge(p.registration_status)}</TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/school-admin/parents/${p.id}`} className="flex items-center gap-2 text-sm"><Eye className="w-4 h-4 shrink-0" /> View</Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/school-admin/parents/${p.id}/edit`} className="flex items-center gap-2 text-sm"><Pencil className="w-4 h-4 shrink-0" /> Edit</Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400" onClick={() => confirmDelete(p)}>
                                                <Trash2 className="w-4 h-4 shrink-0" /> Remove
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {parents.last_page > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t border-slate-200 dark:border-slate-800">
                        <p className="text-xs text-slate-500">Page {parents.current_page} of {parents.last_page} ({parents.total} total)</p>
                        <div className="flex gap-1">
                            {parents.current_page > 1 && (
                                <Button variant="outline" size="sm" onClick={() => router.get(`/school-admin/parents?page=${parents.current_page - 1}`)}>Previous</Button>
                            )}
                            {parents.current_page < parents.last_page && (
                                <Button variant="outline" size="sm" onClick={() => router.get(`/school-admin/parents?page=${parents.current_page + 1}`)}>Next</Button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <ImportUploadDialog open={importOpen} onOpenChange={setImportOpen} type="parents" label="Parents" />
        </AppLayout>
    );
}
