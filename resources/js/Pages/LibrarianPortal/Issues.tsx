import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BookMarked } from 'lucide-react';
import { router } from '@inertiajs/react';

interface Issue {
    id: number; book_title: string; member_name: string;
    issued_date: string | null; due_date: string | null;
    returned_date: string | null; status: string; fine: number;
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

function cn(...classes: (string | boolean | undefined | null)[]) {
    return classes.filter(Boolean).join(' ');
}

export default function LibrarianIssues({ linked, issues }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Book Issues">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <BookMarked className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const handleReturn = (id: number) => {
        router.post(`/school/library/issues/${id}/return`, {}, { preserveState: true });
    };

    return (
        <AppLayout title="Book Issues">
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Book Issues</h1>
                    <p className="text-sm text-slate-500">{issues.total} issue{issues.total !== 1 ? 's' : ''}</p>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Book</TableHead>
                                    <TableHead>Issued To</TableHead>
                                    <TableHead>Issued Date</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead>Returned</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Fine</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {issues.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-slate-400">No issues found.</TableCell>
                                    </TableRow>
                                ) : (
                                    issues.data.map(i => (
                                        <TableRow key={i.id}>
                                            <TableCell className="font-medium">{i.book_title}</TableCell>
                                            <TableCell>{i.member_name}</TableCell>
                                            <TableCell className="text-xs">{i.issued_date ?? '—'}</TableCell>
                                            <TableCell className="text-xs">{i.due_date ?? '—'}</TableCell>
                                            <TableCell className="text-xs">{i.returned_date ?? '—'}</TableCell>
                                            <TableCell><Badge className={cn('text-[10px]', statusColor[i.status] ?? 'bg-slate-100 text-slate-600')}>{i.status}</Badge></TableCell>
                                            <TableCell className="text-xs">{i.fine > 0 ? `Le ${i.fine.toLocaleString()}` : '—'}</TableCell>
                                            <TableCell>
                                                {i.status === 'issued' && (
                                                    <Button size="sm" variant="outline" onClick={() => handleReturn(i.id)}>Return</Button>
                                                )}
                                            </TableCell>
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
                            <Button variant="outline" size="sm" disabled={issues.current_page <= 1} onClick={() => router.get(`/school/librarian/issues?page=${issues.current_page - 1}`, {}, { preserveState: true })}>Previous</Button>
                            <Button variant="outline" size="sm" disabled={issues.current_page >= issues.last_page} onClick={() => router.get(`/school/librarian/issues?page=${issues.current_page + 1}`, {}, { preserveState: true })}>Next</Button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
