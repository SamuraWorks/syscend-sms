import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Search, Users } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { PageProps, PaginatedResponse, Guardian } from '@/Types';

interface Props extends PageProps {
    parents: PaginatedResponse<Guardian & { students_count?: number; registration_status?: string | null }>;
    filters: { search?: string; registration_status?: string };
}

const registrationBadge = (status: string | null) => {
    const map: Record<string, string> = {
        registered:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
        approved:     'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
        pending:      'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
        rejected:     'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
        unregistered: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    };
    const key = (status ?? 'unregistered').toLowerCase();
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[key] ?? map.unregistered}`}>
            {(status ?? 'Unregistered').charAt(0).toUpperCase() + (status ?? 'Unregistered').slice(1)}
        </span>
    );
};

export default function RegistryParents() {
    const { parents, filters } = usePage<Props>().props;
    const [search, setSearch] = useState(filters.search ?? '');

    const applyFilter = (params: Record<string, string>) =>
        router.get('/school-admin/registry/parents', { ...filters, ...params }, { preserveState: true, replace: true });

    return (
        <AppLayout breadcrumbs={[{ label: 'Registry' }, { label: 'Parents' }]}>
            <Head title="Registry — Parents" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Parent Registry</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Parents/guardians on record and their portal registration status</p>
                </div>
                <Button variant="outline" size="sm" asChild className="inline-flex items-center gap-2">
                    <Link href="/school-admin/registry"><Users className="w-4 h-4" /> Registry Overview</Link>
                </Button>
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
                    <Select value={filters.registration_status ?? 'all'} onValueChange={(v) => applyFilter({ registration_status: v === 'all' ? '' : v })}>
                        <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Registration" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All registrations</SelectItem>
                            <SelectItem value="registered">Registered</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="unregistered">Unregistered</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead>Parent</TableHead>
                            <TableHead className="hidden sm:table-cell">Phone</TableHead>
                            <TableHead className="hidden md:table-cell">Email</TableHead>
                            <TableHead>Children</TableHead>
                            <TableHead>Portal</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {parents.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-16 text-slate-400">
                                    <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">No parents found</p>
                                </TableCell>
                            </TableRow>
                        ) : parents.data.map((p) => (
                            <TableRow key={p.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center shrink-0 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                            {(p.name?.[0] ?? '?').toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white text-sm">{p.name}</p>
                                            {p.relation && <p className="text-xs text-slate-400 capitalize">{p.relation}</p>}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell text-sm text-slate-600 dark:text-slate-400">{p.phone ?? '—'}</TableCell>
                                <TableCell className="hidden md:table-cell text-sm text-slate-600 dark:text-slate-400">{p.email ?? '—'}</TableCell>
                                <TableCell className="text-sm text-slate-600 dark:text-slate-400">{p.students_count ?? 0}</TableCell>
                                <TableCell>{registrationBadge(p.registration_status ?? null)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {parents.meta.last_page > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t border-slate-200 dark:border-slate-800">
                        <p className="text-xs text-slate-500">Showing {parents.meta.from}–{parents.meta.to} of {parents.meta.total}</p>
                        <div className="flex gap-1">
                            {parents.links.prev && <Button variant="outline" size="sm" onClick={() => router.get(parents.links.prev!)}>Previous</Button>}
                            {parents.links.next && <Button variant="outline" size="sm" onClick={() => router.get(parents.links.next!)}>Next</Button>}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}