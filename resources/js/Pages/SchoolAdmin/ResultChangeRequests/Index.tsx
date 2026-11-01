import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';
import { FileCheck, CheckCircle, XCircle, Clock, User, BookOpen } from 'lucide-react';
import { useState } from 'react';

interface ChangeRequest {
    id: number;
    mark_id: number;
    requested_by: number;
    original_marks: number;
    requested_marks: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewer_notes: string | null;
    reviewed_at: string | null;
    created_at: string;
    mark: {
        id: number;
        marks_obtained: number;
        student: { id: number; full_name: string; admission_no: string };
        exam: { id: number; name: string };
        subject: { id: number; name: string };
    };
    requester: { id: number; name: string };
    reviewer: { id: number; name: string } | null;
}

interface PaginatedData {
    data: ChangeRequest[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    linked: boolean;
    requests: PaginatedData;
}

const statusConfig: Record<string, { label: string; variant: string; icon: React.ElementType }> = {
    pending:  { label: 'Pending',  variant: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
    approved: { label: 'Approved', variant: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle },
    rejected: { label: 'Rejected', variant: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
};

export default function ResultChangeRequestsIndex({ linked, requests }: Props) {
    const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({});

    if (!linked) {
        return (
            <AppLayout title="Result Change Requests">
                <div className="text-center py-12 text-muted-foreground">Access denied.</div>
            </AppLayout>
        );
    }

    const handleApprove = (id: number) => {
        router.post(`/school/result-change-requests/${id}/approve`, {}, { preserveScroll: true });
    };

    const handleReject = (id: number) => {
        router.post(`/school/result-change-requests/${id}/reject`, {
            reviewer_notes: reviewNotes[id] || 'No reason provided',
        }, { preserveScroll: true });
    };

    const pendingCount = requests.data.filter(r => r.status === 'pending').length;
    const approvedCount = requests.data.filter(r => r.status === 'approved').length;
    const rejectedCount = requests.data.filter(r => r.status === 'rejected').length;

    return (
        <AppLayout title="Result Change Requests">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                        <FileCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Result Change Requests</h2>
                        <p className="text-muted-foreground text-sm">Review and manage score correction requests</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                                    <Clock className="h-4 w-4 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{pendingCount}</p>
                                    <p className="text-xs text-muted-foreground">Pending Review</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{approvedCount}</p>
                                    <p className="text-xs text-muted-foreground">Approved</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                                    <XCircle className="h-4 w-4 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{rejectedCount}</p>
                                    <p className="text-xs text-muted-foreground">Rejected</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Requests List */}
                {requests.data.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            No change requests found.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {requests.data.map((req) => {
                            const config = statusConfig[req.status];
                            const StatusIcon = config.icon;
                            return (
                                <Card key={req.id}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    {req.mark?.student?.full_name}
                                                    <span className="text-sm font-normal text-muted-foreground">
                                                        ({req.mark?.student?.admission_no})
                                                    </span>
                                                </CardTitle>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <BookOpen className="h-3 w-3" />
                                                    <span>{req.mark?.subject?.name}</span>
                                                    <span>•</span>
                                                    <span>{req.mark?.exam?.name}</span>
                                                </div>
                                            </div>
                                            <Badge className={config.variant}>
                                                <StatusIcon className="h-3 w-3 mr-1" />
                                                {config.label}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Original Score</p>
                                                <p className="text-lg font-semibold">{req.original_marks}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Requested Score</p>
                                                <p className="text-lg font-semibold text-indigo-600">{req.requested_marks}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Requested By</p>
                                                <p className="text-sm font-medium">{req.requester?.name}</p>
                                                <p className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="p-3 rounded-lg bg-muted/50 mb-4">
                                            <p className="text-xs text-muted-foreground mb-1">Reason</p>
                                            <p className="text-sm">{req.reason}</p>
                                        </div>
                                        {req.status === 'pending' && (
                                            <div className="flex items-center gap-3 pt-2 border-t">
                                                <input
                                                    type="text"
                                                    placeholder="Reviewer notes (optional)"
                                                    className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
                                                    value={reviewNotes[req.id] || ''}
                                                    onChange={(e) => setReviewNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
                                                />
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-emerald-600 hover:text-emerald-700"
                                                    onClick={() => handleApprove(req.id)}
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-600 hover:text-red-700"
                                                    onClick={() => handleReject(req.id)}
                                                >
                                                    <XCircle className="h-4 w-4 mr-1" />
                                                    Reject
                                                </Button>
                                            </div>
                                        )}
                                        {req.reviewer && (
                                            <div className="pt-2 border-t mt-2">
                                                <p className="text-xs text-muted-foreground">
                                                    Reviewed by {req.reviewer.name} on {req.reviewed_at ? new Date(req.reviewed_at).toLocaleDateString() : '—'}
                                                </p>
                                                {req.reviewer_notes && (
                                                    <p className="text-sm mt-1">{req.reviewer_notes}</p>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
