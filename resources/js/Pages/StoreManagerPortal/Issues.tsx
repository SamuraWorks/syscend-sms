import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Box } from 'lucide-react';
import { router } from '@inertiajs/react';

interface Issue {
    id: number; item_name: string; issued_to_name: string;
    quantity: number; issue_date: string | null;
    return_date: string | null; purpose: string | null; status: string;
}
interface PaginatedData {
    data: Issue[];
    current_page: number; last_page: number; per_page: number; total: number;
}
interface Props {
    linked: boolean;
    issues: PaginatedData;
}

const statusColor: Record<string, string> = {
    issued: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    returned: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export default function StoreManagerIssues({ linked, issues }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Item Issues">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Box className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Item Issues">
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Item Issues</h1>
                    <p className="text-sm text-slate-500">{issues.total} record{issues.total !== 1 ? 's' : ''}</p>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Issued To</TableHead>
                                    <TableHead className="text-center">Qty</TableHead>
                                    <TableHead>Purpose</TableHead>
                                    <TableHead>Issue Date</TableHead>
                                    <TableHead>Return Date</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {issues.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-slate-400">No issues found.</TableCell>
                                    </TableRow>
                                ) : (
                                    issues.data.map(i => (
                                        <TableRow key={i.id}>
                                            <TableCell className="font-medium">{i.item_name}</TableCell>
                                            <TableCell>{i.issued_to_name}</TableCell>
                                            <TableCell className="text-center text-xs">{i.quantity}</TableCell>
                                            <TableCell className="text-xs text-slate-500 max-w-[200px] truncate">{i.purpose ?? '—'}</TableCell>
                                            <TableCell className="text-xs">{i.issue_date ?? '—'}</TableCell>
                                            <TableCell className="text-xs">{i.return_date ?? '—'}</TableCell>
                                            <TableCell><Badge className={cn('text-[10px]', statusColor[i.status] ?? 'bg-slate-100 text-slate-600')}>{i.status}</Badge></TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {issues.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">Page {issues.current_page} of {issues.last_page}</p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={issues.current_page <= 1} onClick={() => router.get(`/school/store-manager/issues?page=${issues.current_page - 1}`, {}, { preserveState: true })}>Previous</Button>
                            <Button variant="outline" size="sm" disabled={issues.current_page >= issues.last_page} onClick={() => router.get(`/school/store-manager/issues?page=${issues.current_page + 1}`, {}, { preserveState: true })}>Next</Button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function cn(...classes: (string | boolean | undefined | null)[]) {
    return classes.filter(Boolean).join(' ');
}
