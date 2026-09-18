import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle } from 'lucide-react';

interface OverdueItem {
    id: number; book_title: string; member_name: string;
    issued_date: string | null; due_date: string | null;
    overdue_days: number; fine: number;
}
interface Props {
    linked: boolean;
    overdue: OverdueItem[];
}

export default function LibrarianOverdue({ linked, overdue }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Overdue Books">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <AlertTriangle className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const totalFines = overdue.reduce((sum, o) => sum + o.fine, 0);

    return (
        <AppLayout title="Overdue Books">
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Overdue Books</h1>
                    <p className="text-sm text-slate-500">{overdue.length} overdue item{overdue.length !== 1 ? 's' : ''} · Total fines: Le {totalFines.toLocaleString()}</p>
                </div>

                {overdue.length === 0 ? (
                    <Card><CardContent className="py-16 text-center text-slate-400">No overdue books.</CardContent></Card>
                ) : (
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Book</TableHead>
                                        <TableHead>Issued To</TableHead>
                                        <TableHead>Issued Date</TableHead>
                                        <TableHead>Due Date</TableHead>
                                        <TableHead className="text-center">Days Overdue</TableHead>
                                        <TableHead className="text-right">Fine</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {overdue.map(o => (
                                        <TableRow key={o.id}>
                                            <TableCell className="font-medium">{o.book_title}</TableCell>
                                            <TableCell>{o.member_name}</TableCell>
                                            <TableCell className="text-xs">{o.issued_date ?? '—'}</TableCell>
                                            <TableCell className="text-xs">{o.due_date ?? '—'}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">{o.overdue_days}d</Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-sm font-semibold">Le {o.fine.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
