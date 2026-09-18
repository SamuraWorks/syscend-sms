import { usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';
import { ArrowLeft, History as HistoryIcon, CheckCircle, XCircle, Send, Eye } from 'lucide-react';
import type { PageProps } from '@/Types';

interface HistoryEntry {
    id: number;
    action: string;
    performed_by: number | null;
    user?: { id: number; name: string };
    old_state?: Record<string, any>;
    new_state?: Record<string, any>;
    notes?: string;
    created_at: string;
}

const ACTION_STYLE: Record<string, { badge: string; icon: React.ElementType }> = {
    approved:  { badge: 'bg-green-100 text-green-700', icon: CheckCircle },
    published: { badge: 'bg-blue-100 text-blue-700',   icon: Eye },
    unpublished: { badge: 'bg-amber-100 text-amber-700', icon: XCircle },
    submitted: { badge: 'bg-purple-100 text-purple-700', icon: Send },
    created:   { badge: 'bg-slate-100 text-slate-600',   icon: HistoryIcon },
};

interface Props extends PageProps {
    history: {
        data: HistoryEntry[];
        meta: { total: number; current_page: number; last_page: number };
        links: { prev: string | null; next: string | null };
    };
}

export default function ReportCardsHistory({ history }: Props) {
    return (
        <AppLayout breadcrumbs={[
            { label: 'Report Cards', href: '/school/report-cards' },
            { label: 'Publication History' },
        ]}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" onClick={() => router.visit('/school/report-cards')}>
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Publication History</h1>
                            <p className="text-sm text-slate-500">Track all report card status changes — approvals, publications, and unpublishes.</p>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-sm">{history.meta.total} entries</Badge>
                </div>

                <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Performed By</TableHead>
                                    <TableHead>Previous Status</TableHead>
                                    <TableHead>New Status</TableHead>
                                    <TableHead>Notes</TableHead>
                                    <TableHead className="text-right">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {history.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                                            <HistoryIcon className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                                            <p>No publication history yet.</p>
                                        </TableCell>
                                    </TableRow>
                                ) : history.data.map((entry) => {
                                    const action = ACTION_STYLE[entry.action] ?? ACTION_STYLE.created;
                                    const Icon = action.icon;
                                    return (
                                        <TableRow key={entry.id}>
                                            <TableCell>
                                                <Badge className={`${action.badge} gap-1`}>
                                                    <Icon className="w-3 h-3" />
                                                    {entry.action}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">{entry.user?.name ?? 'System'}</TableCell>
                                            <TableCell className="text-sm text-slate-500">{entry.old_state?.status ?? '—'}</TableCell>
                                            <TableCell className="text-sm text-slate-500">{entry.new_state?.status ?? '—'}</TableCell>
                                            <TableCell className="text-sm text-slate-500 max-w-[200px] truncate">{entry.notes ?? '—'}</TableCell>
                                            <TableCell className="text-right text-sm text-slate-500">
                                                {new Date(entry.created_at).toLocaleDateString('en-GB', {
                                                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {history.meta.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            Page {history.meta.current_page} of {history.meta.last_page}
                        </p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={!history.links.prev}
                                onClick={() => history.links.prev && router.get(history.links.prev)}>
                                Previous
                            </Button>
                            <Button variant="outline" size="sm" disabled={!history.links.next}
                                onClick={() => history.links.next && router.get(history.links.next)}>
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
