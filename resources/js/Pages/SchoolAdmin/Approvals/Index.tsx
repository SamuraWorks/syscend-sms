import { router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, XCircle, Clock, FileText, Eye } from 'lucide-react';
import type { PageProps } from '@/Types';

interface Exam {
    id: number; name: string; status: string; submitted_at: string | null;
    schoolClass?: { name: string }; term?: { name: string };
    submittedByUser?: { name: string };
}

interface ReportCard {
    id: number; status: string; submitted_at: string | null; percentage: number | null;
    student?: { first_name: string; last_name: string; admission_no: string };
    schoolClass?: { name: string }; term?: { name: string };
}

interface ApprovalLog {
    id: number; action: string; notes: string | null; created_at: string;
    user?: { name: string };
}

interface Props {
    pendingExams: Exam[];
    pendingReportCards: ReportCard[];
    recentLogs: ApprovalLog[];
    stats: { pending_exams: number; pending_report_cards: number };
}

const ACTION_COLORS: Record<string, string> = {
    submitted: 'bg-amber-100 text-amber-700', approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700', published: 'bg-blue-100 text-blue-700',
    corrected: 'bg-purple-100 text-purple-700',
};

export default function ApprovalsIndex({ pendingExams, pendingReportCards, recentLogs, stats }: Props) {
    const { flash } = usePage<PageProps>().props;

    function approveExam(exam: Exam) {
        if (confirm(`Approve "${exam.name}"? This will publish results and lock marks.`)) {
            router.post(`/school/approvals/exams/${exam.id}/approve`);
        }
    }

    function rejectExam(exam: Exam) {
        const notes = prompt('Rejection reason (required):');
        if (notes) {
            router.post(`/school/approvals/exams/${exam.id}/reject`, { notes });
        }
    }

    function approveReportCard(rc: ReportCard) {
        router.post(`/school/approvals/report-cards/${rc.id}/approve`);
    }

    function publishReportCard(rc: ReportCard) {
        router.post(`/school/approvals/report-cards/${rc.id}/publish`);
    }

    return (
        <AppLayout title="Result Approvals">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Result Approvals</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Review and approve examination results and report cards</p>
                </div>

                {flash?.success && <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{flash.success}</div>}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <Card className="border-slate-200 dark:border-slate-800">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950"><FileText className="w-5 h-5 text-amber-600" /></div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pending_exams}</p>
                                <p className="text-xs text-slate-500">Pending Exams</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-slate-200 dark:border-slate-800">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950"><Eye className="w-5 h-5 text-blue-600" /></div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pending_report_cards}</p>
                                <p className="text-xs text-slate-500">Pending Report Cards</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Pending Exams */}
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Exams Pending Approval</h2>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 dark:bg-slate-900">
                                    <TableHead>Exam</TableHead>
                                    <TableHead>Class</TableHead>
                                    <TableHead>Term</TableHead>
                                    <TableHead>Submitted By</TableHead>
                                    <TableHead>Submitted</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingExams.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400">No exams pending approval.</TableCell></TableRow>
                                ) : pendingExams.map(exam => (
                                    <TableRow key={exam.id}>
                                        <TableCell className="font-medium text-slate-900 dark:text-white">{exam.name}</TableCell>
                                        <TableCell className="text-sm text-slate-500">{exam.schoolClass?.name ?? '—'}</TableCell>
                                        <TableCell className="text-sm text-slate-500">{exam.term?.name ?? '—'}</TableCell>
                                        <TableCell className="text-sm text-slate-500">{exam.submittedByUser?.name ?? '—'}</TableCell>
                                        <TableCell className="text-sm text-slate-500">{exam.submitted_at ? new Date(exam.submitted_at).toLocaleDateString() : '—'}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs inline-flex items-center gap-1" onClick={() => approveExam(exam)}>
                                                    <CheckCircle2 className="w-3 h-3" /> Approve
                                                </Button>
                                                <Button size="sm" variant="outline" className="text-xs text-red-600 hover:text-red-700" onClick={() => rejectExam(exam)}>
                                                    <XCircle className="w-3 h-3" /> Reject
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Pending Report Cards */}
                {pendingReportCards.length > 0 && (
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Report Cards Pending Approval</h2>
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 dark:bg-slate-900">
                                        <TableHead>Student</TableHead>
                                        <TableHead>Class</TableHead>
                                        <TableHead>Percentage</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingReportCards.map(rc => (
                                        <TableRow key={rc.id}>
                                            <TableCell className="font-medium text-slate-900 dark:text-white">{rc.student?.first_name} {rc.student?.last_name}</TableCell>
                                            <TableCell className="text-sm text-slate-500">{rc.schoolClass?.name ?? '—'}</TableCell>
                                            <TableCell className="text-sm">{rc.percentage ? `${rc.percentage}%` : '—'}</TableCell>
                                            <TableCell><Badge className={`border-0 text-xs ${ACTION_COLORS[rc.status] ?? 'bg-slate-100 text-slate-600'}`}>{rc.status}</Badge></TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs" onClick={() => approveReportCard(rc)}>Approve</Button>
                                                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs" onClick={() => publishReportCard(rc)}>Publish</Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}

                {/* Recent Activity */}
                {recentLogs.length > 0 && (
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Recent Activity</h2>
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 dark:bg-slate-900">
                                        <TableHead>Action</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Notes</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentLogs.map(log => (
                                        <TableRow key={log.id}>
                                            <TableCell><Badge className={`border-0 text-xs ${ACTION_COLORS[log.action] ?? 'bg-slate-100 text-slate-600'}`}>{log.action}</Badge></TableCell>
                                            <TableCell className="text-sm">{log.user?.name ?? '—'}</TableCell>
                                            <TableCell className="text-sm text-slate-500 max-w-[200px] truncate">{log.notes ?? '—'}</TableCell>
                                            <TableCell className="text-sm text-slate-500">{new Date(log.created_at).toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
