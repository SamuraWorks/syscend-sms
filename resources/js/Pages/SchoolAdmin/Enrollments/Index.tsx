import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Search, BookOpen, UserMinus, Users2 } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { PageProps, PaginatedResponse } from '@/Types';

interface Enrollment {
    id: number;
    student: { id: number; first_name: string; last_name: string; student_id: string };
    subjectOffering: { id: number; subject_name: string; subject_code: string; subject_type: string };
    academicYear: { id: number; name: string };
    status: 'enrolled' | 'dropped' | 'pending';
    enrolled_at: string | null;
}

interface Props extends PageProps {
    enrollments: PaginatedResponse<Enrollment>;
    filters: { student_id?: string; class_id?: string; academic_year_id?: string; status?: string };
    classes: { id: number; name: string }[];
    academicYears: { id: number; name: string }[];
}

const statusBadge = (status: string) => {
    const map: Record<string, string> = {
        enrolled: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
        pending:  'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
        dropped:  'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? map.pending}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
};

export default function EnrollmentsIndex() {
    const { enrollments = { data: [], meta: { total: 0, per_page: 15, current_page: 1, last_page: 1, from: null, to: null }, links: { first: null, last: null, prev: null, next: null } }, filters = {}, classes = [], academicYears = [] } = usePage<Props>().props;
    const [search, setSearch] = useState(filters.student_id ?? '');

    const applyFilter = (params: Record<string, string>) =>
        router.get('/school-admin/enrollments', { ...filters, ...params }, { preserveState: true, replace: true });

    const handleDrop = (enrollment: Enrollment) => {
        if (!confirm(`Drop ${enrollment.student.first_name} ${enrollment.student.last_name} from ${enrollment.subjectOffering.subject_name}?`)) return;
        router.patch(`/school-admin/enrollments/${enrollment.id}/drop`);
    };

    return (
        <AppLayout breadcrumbs={[{ label: 'Enrollments' }]}>
            <Head title="Enrollments" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Subject Enrollments</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Manage student subject enrollments across academic years</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild className="inline-flex items-center gap-2">
                        <Link href="/school-admin/enrollments/create?bulk=1">
                            <Users2 className="w-4 h-4" /> Bulk Enroll
                        </Link>
                    </Button>
                    <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white inline-flex items-center gap-2">
                        <Link href="/school-admin/enrollments/create">
                            <Plus className="w-4 h-4" /> New Enrollment
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                <div className="flex flex-wrap items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-800">
                    <form onSubmit={(e) => { e.preventDefault(); applyFilter({ student_id: search }); }} className="flex items-center gap-2 flex-1 min-w-52 max-w-sm">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search by student ID…"
                                className="pl-9 h-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Button type="submit" size="sm" variant="secondary">Search</Button>
                    </form>

                    <Select value={filters.class_id ?? 'all'} onValueChange={(v) => applyFilter({ class_id: v === 'all' ? '' : v })}>
                        <SelectTrigger className="w-36 h-9"><SelectValue placeholder="All classes" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All classes</SelectItem>
                            {classes.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filters.academic_year_id ?? 'all'} onValueChange={(v) => applyFilter({ academic_year_id: v === 'all' ? '' : v })}>
                        <SelectTrigger className="w-40 h-9"><SelectValue placeholder="All years" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All years</SelectItem>
                            {academicYears.map((y) => (
                                <SelectItem key={y.id} value={String(y.id)}>{y.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filters.status ?? 'all'} onValueChange={(v) => applyFilter({ status: v === 'all' ? '' : v })}>
                        <SelectTrigger className="w-32 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All status</SelectItem>
                            <SelectItem value="enrolled">Enrolled</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="dropped">Dropped</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead>Student</TableHead>
                            <TableHead className="hidden sm:table-cell">Student ID</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead className="hidden md:table-cell">Type</TableHead>
                            <TableHead className="hidden lg:table-cell">Year</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="hidden lg:table-cell">Enrolled At</TableHead>
                            <TableHead className="w-10" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {enrollments.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-16 text-slate-400">
                                    <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">No enrollments found</p>
                                </TableCell>
                            </TableRow>
                        ) : enrollments.data.map((e) => (
                            <TableRow key={e.id}>
                                <TableCell className="font-medium text-slate-900 dark:text-white text-sm">
                                    {e.student.first_name} {e.student.last_name}
                                </TableCell>
                                <TableCell className="hidden sm:table-cell text-sm font-mono text-slate-500">
                                    {e.student.student_id}
                                </TableCell>
                                <TableCell className="text-sm text-slate-700 dark:text-slate-300">
                                    <div>
                                        <span className="font-medium">{e.subjectOffering.subject_name}</span>
                                        <span className="text-xs text-slate-400 ml-1.5">{e.subjectOffering.subject_code}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded capitalize">
                                        {e.subjectOffering.subject_type}
                                    </span>
                                </TableCell>
                                <TableCell className="hidden lg:table-cell text-sm text-slate-500">
                                    {e.academicYear.name}
                                </TableCell>
                                <TableCell>{statusBadge(e.status)}</TableCell>
                                <TableCell className="hidden lg:table-cell text-xs text-slate-400">
                                    {e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString() : '—'}
                                </TableCell>
                                <TableCell>
                                    {e.status !== 'dropped' && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-500 hover:text-red-600"
                                            onClick={() => handleDrop(e)}
                                        >
                                            <UserMinus className="w-3.5 h-3.5" />
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {enrollments.meta.last_page > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t border-slate-200 dark:border-slate-800">
                        <p className="text-xs text-slate-500">
                            Showing {enrollments.meta.from}–{enrollments.meta.to} of {enrollments.meta.total}
                        </p>
                        <div className="flex gap-1">
                            {enrollments.links.prev && (
                                <Button variant="outline" size="sm" onClick={() => router.get(enrollments.links.prev!)}>Previous</Button>
                            )}
                            {enrollments.links.next && (
                                <Button variant="outline" size="sm" onClick={() => router.get(enrollments.links.next!)}>Next</Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
