import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Search, UserCog } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { PageProps, PaginatedResponse, Staff } from '@/Types';

interface Props extends PageProps {
    staff: PaginatedResponse<Staff>;
    filters: { search?: string; status?: string; registration_status?: string };
}

const statusBadge = (status: string) => {
    const map: Record<string, string> = {
        active:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
        on_leave:   'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
        terminated: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
        resigned:   'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? map.resigned}`}>
            {(status.charAt(0).toUpperCase() + status.slice(1)).replace(/_/g, ' ')}
        </span>
    );
};

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

export default function RegistryStaff() {
    const { staff, filters } = usePage<Props>().props;
    const [search, setSearch] = useState(filters.search ?? '');

    const applyFilter = (params: Record<string, string>) =>
        router.get('/school-admin/registry/staff', { ...filters, ...params }, { preserveState: true, replace: true });

    return (
        <AppLayout breadcrumbs={[{ label: 'Registry' }, { label: 'Staff' }]}>
            <Head title="Registry — Staff" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Staff Registry</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Staff on record and their portal registration status</p>
                </div>
                <Button variant="outline" size="sm" asChild className="inline-flex items-center gap-2">
                    <Link href="/school-admin/registry"><UserCog className="w-4 h-4" /> Registry Overview</Link>
                </Button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                <div className="flex flex-wrap items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-800">
                    <form onSubmit={(e) => { e.preventDefault(); applyFilter({ search }); }} className="flex items-center gap-2 flex-1 min-w-52 max-w-sm">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input placeholder="Search name / staff ID…" className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                        <Button type="submit" size="sm" variant="secondary">Search</Button>
                    </form>
                    <Select value={filters.status ?? 'all'} onValueChange={(v) => applyFilter({ status: v === 'all' ? '' : v })}>
                        <SelectTrigger className="w-32 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="on_leave">On Leave</SelectItem>
                            <SelectItem value="resigned">Resigned</SelectItem>
                            <SelectItem value="terminated">Terminated</SelectItem>
                        </SelectContent>
                    </Select>
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
                            <TableHead>Staff</TableHead>
                            <TableHead className="hidden sm:table-cell">Staff ID</TableHead>
                            <TableHead className="hidden lg:table-cell">Department</TableHead>
                            <TableHead className="hidden md:table-cell">Designation</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Portal</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {staff.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                                    <UserCog className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">No staff found</p>
                                </TableCell>
                            </TableRow>
                        ) : staff.data.map((s) => (
                            <TableRow key={s.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center shrink-0 text-xs font-bold text-amber-600 dark:text-amber-400">
                                            {s.photo_url
                                                ? <img src={s.photo_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                                                : (s.first_name?.[0] ?? '?').toUpperCase()
                                            }
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white text-sm">{s.full_name}</p>
                                            <p className="text-xs text-slate-400">{s.email ?? ''}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell text-sm font-mono text-slate-500">{s.emp_id}</TableCell>
                                <TableCell className="hidden lg:table-cell text-sm text-slate-600 dark:text-slate-400">{s.department?.name ?? '—'}</TableCell>
                                <TableCell className="hidden md:table-cell text-sm text-slate-600 dark:text-slate-400">{s.designation?.name ?? '—'}</TableCell>
                                <TableCell>{statusBadge(s.status)}</TableCell>
                                <TableCell>{registrationBadge(s.registration_status ?? null)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {staff.meta.last_page > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t border-slate-200 dark:border-slate-800">
                        <p className="text-xs text-slate-500">Showing {staff.meta.from}–{staff.meta.to} of {staff.meta.total}</p>
                        <div className="flex gap-1">
                            {staff.links.prev && <Button variant="outline" size="sm" onClick={() => router.get(staff.links.prev!)}>Previous</Button>}
                            {staff.links.next && <Button variant="outline" size="sm" onClick={() => router.get(staff.links.next!)}>Next</Button>}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}