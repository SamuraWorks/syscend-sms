import { router, usePage } from '@inertiajs/react';
import { Link, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Eye, Upload, FileText, CheckCircle2, XCircle, Loader2, FileSpreadsheet, Users, GraduationCap, BookOpen } from 'lucide-react';
import type { PageProps } from '@/Types';

interface ImportJob {
    id: number;
    import_type: string;
    file_name: string;
    status: string;
    total_rows: number;
    valid_rows: number;
    error_rows: number;
    imported_rows: number;
    created_at: string;
}

interface Props {
    imports: { data: ImportJob[]; current_page: number; last_page: number; per_page: number; total: number };
}

const TYPE_STYLE: Record<string, string> = {
    students: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
    parents: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400',
    staff: 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400',
    curriculum: 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400',
};

const TYPE_ICON: Record<string, typeof Upload> = {
    students: GraduationCap,
    parents: Users,
    staff: Users,
    curriculum: BookOpen,
};

const STATUS_STYLE: Record<string, string> = {
    completed: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400',
    validating: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400',
    failed: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
    uploaded: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    importing: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
};

const STATUS_ICON: Record<string, typeof Upload> = {
    completed: CheckCircle2,
    validating: Loader2,
    failed: XCircle,
    uploaded: FileText,
    importing: Loader2,
};

export default function BulkImportsIndex({ imports = { data: [], current_page: 1, last_page: 1, per_page: 15, total: 0 } }: Props) {
    const { flash } = usePage<PageProps>().props;

    return (
        <AppLayout title="Bulk Import">
            <Head title="Bulk Import" />
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bulk Import</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage student, parent, staff, and curriculum imports</p>
                    </div>
                    <Link href="/school-admin/imports/create">
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white inline-flex items-center gap-2">
                            <Plus className="w-4 h-4" /> New Import
                        </Button>
                    </Link>
                </div>

                {flash?.success && <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 dark:bg-green-950/30 dark:border-green-900 dark:text-green-400">{flash.success}</div>}
                {flash?.error && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400">{flash.error}</div>}

                {/* Table */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 dark:bg-slate-900">
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>File</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="hidden md:table-cell">Rows</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {imports.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                                        No imports yet. Click "New Import" to get started.
                                    </TableCell>
                                </TableRow>
                            ) : imports.data.map(imp => {
                                const StatusIcon = STATUS_ICON[imp.status] ?? FileText;
                                const TypeIcon = TYPE_ICON[imp.import_type] ?? FileText;
                                const showPreview = imp.status !== 'completed';
                                return (
                                    <TableRow key={imp.id}>
                                        <TableCell className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                            {new Date(imp.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`border-0 text-xs inline-flex items-center gap-1 ${TYPE_STYLE[imp.import_type] ?? ''}`}>
                                                <TypeIcon className="w-3 h-3" /> {imp.import_type.charAt(0).toUpperCase() + imp.import_type.slice(1)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-medium text-sm text-slate-900 dark:text-white truncate max-w-[200px]">{imp.file_name}</p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`border-0 text-xs inline-flex items-center gap-1 ${STATUS_STYLE[imp.status] ?? ''}`}>
                                                <StatusIcon className={`w-3 h-3 ${imp.status === 'validating' || imp.status === 'importing' ? 'animate-spin' : ''}`} />
                                                {imp.status.charAt(0).toUpperCase() + imp.status.slice(1)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                            {imp.imported_rows ?? 0}/{imp.total_rows}
                                        </TableCell>
                                        <TableCell>
                                            {showPreview ? (
                                                <Link href={`/school-admin/imports/${imp.id}/preview`}>
                                                    <Button variant="outline" size="sm" className="text-xs inline-flex items-center gap-1">
                                                        <Eye className="w-3 h-3" /> Preview
                                                    </Button>
                                                </Link>
                                            ) : (
                                                <span className="text-xs text-slate-400">—</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {imports.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-400">Page {imports.current_page} of {imports.last_page} ({imports.total} total)</p>
                        <div className="flex gap-2">
                            {imports.current_page > 1 && (
                                <Button variant="outline" size="sm" onClick={() => router.get(`/school-admin/imports?page=${imports.current_page - 1}`)}>
                                    Previous
                                </Button>
                            )}
                            {imports.current_page < imports.last_page && (
                                <Button variant="outline" size="sm" onClick={() => router.get(`/school-admin/imports?page=${imports.current_page + 1}`)}>
                                    Next
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
