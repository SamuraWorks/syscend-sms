import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useState } from 'react';
import { router, Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import {
    ShieldCheck, ChevronRight, CheckCircle, XCircle, Clock, AlertTriangle,
    Loader2,
} from 'lucide-react';

interface Exam {
    id: number; name: string; type: string; class: string | null;
    start_date: string | null; end_date: string | null;
    submitted_by: string | null; submitted_at: string | null;
}
interface HistoryItem {
    id: number; name: string; type: string; class: string | null;
    status: string; approved_by: string | null; approved_at: string | null;
    rejection_reason: string | null;
}
interface Props {
    linked: boolean;
    pendingExams: Exam[];
    approvalHistory: HistoryItem[];
}

export default function Approvals({ linked, pendingExams, approvalHistory }: Props) {
    const [rejectingId, setRejectingId] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({ only: ['pendingExams', 'approvalHistory'] });
        }, 15000);
        return () => clearInterval(interval);
    }, []);

    if (!linked) {
        return (
            <AppLayout title="Approvals">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <ShieldCheck className="w-16 h-16 text-slate-300 mb-4" />
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Account not linked</h2>
                    <p className="text-slate-500 mt-2 max-w-sm">Contact the school administrator.</p>
                </div>
            </AppLayout>
        );
    }

    function handleApprove(examId: number) {
        if (!confirm('Approve this examination?')) return;
        setProcessing(true);
        router.post(`/school/principal/approvals/${examId}/approve`, {}, {
            onFinish: () => setProcessing(false),
        });
    }

    function handleReject(examId: number) {
        if (!rejectReason.trim()) return;
        setProcessing(true);
        router.post(`/school/principal/approvals/${examId}/reject`, { reason: rejectReason }, {
            onFinish: () => { setProcessing(false); setRejectingId(null); setRejectReason(''); },
        });
    }

    return (
        <AppLayout title="Approvals">
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/school/principal/dashboard" className="hover:text-slate-700 dark:hover:text-slate-300">Principal</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Approvals</span>
                </div>

                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Examination Approvals</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Review and approve examinations submitted by school administration.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-amber-500" /> Pending Approvals ({pendingExams.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {pendingExams.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-8">No pending approvals.</p>
                        ) : (
                            <div className="space-y-4">
                                {pendingExams.map(exam => (
                                    <div key={exam.id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-3">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className="font-semibold text-slate-900 dark:text-white">{exam.name}</h3>
                                                <p className="text-sm text-slate-500">{exam.type} · {exam.class ?? 'All Classes'}</p>
                                                {exam.start_date && (
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        {exam.start_date}{exam.end_date ? ` — ${exam.end_date}` : ''}
                                                    </p>
                                                )}
                                            </div>
                                            <Badge variant="outline" className="text-amber-600 border-amber-300">
                                                <Clock className="w-3 h-3 mr-1" /> Pending
                                            </Badge>
                                        </div>
                                        {exam.submitted_by && (
                                            <p className="text-xs text-slate-400">
                                                Submitted by {exam.submitted_by}{exam.submitted_at ? ` on ${exam.submitted_at}` : ''}
                                            </p>
                                        )}
                                        {rejectingId === exam.id ? (
                                            <div className="space-y-2">
                                                <Textarea
                                                    value={rejectReason}
                                                    onChange={e => setRejectReason(e.target.value)}
                                                    placeholder="Reason for rejection..."
                                                    rows={2}
                                                />
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="destructive" disabled={processing || !rejectReason.trim()} onClick={() => handleReject(exam.id)}>
                                                        {processing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <XCircle className="w-3 h-3 mr-1" />}
                                                        Confirm Reject
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={() => { setRejectingId(null); setRejectReason(''); }}>
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" disabled={processing} onClick={() => handleApprove(exam.id)}>
                                                    <CheckCircle className="w-3 h-3 mr-1" /> Approve
                                                </Button>
                                                <Button size="sm" variant="destructive" onClick={() => setRejectingId(exam.id)}>
                                                    <XCircle className="w-3 h-3 mr-1" /> Reject
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {approvalHistory.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm">
                                <ShieldCheck className="w-4 h-4 text-slate-500" /> Recent History
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-700">
                                            <th className="text-left py-2 font-medium text-slate-500">Exam</th>
                                            <th className="text-left py-2 font-medium text-slate-500">Class</th>
                                            <th className="text-left py-2 font-medium text-slate-500">Status</th>
                                            <th className="text-left py-2 font-medium text-slate-500">By</th>
                                            <th className="text-left py-2 font-medium text-slate-500">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {approvalHistory.map(item => (
                                            <tr key={item.id}>
                                                <td className="py-2.5 text-slate-900 dark:text-white font-medium">{item.name}</td>
                                                <td className="py-2.5 text-slate-500">{item.class ?? '—'}</td>
                                                <td className="py-2.5">
                                                    <Badge variant={item.status === 'approved' ? 'default' : 'destructive'} className="text-xs">
                                                        {item.status}
                                                    </Badge>
                                                </td>
                                                <td className="py-2.5 text-slate-500">{item.approved_by ?? '—'}</td>
                                                <td className="py-2.5 text-slate-400 text-xs">{item.approved_at ?? '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
