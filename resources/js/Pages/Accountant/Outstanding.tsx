import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Users, DollarSign, TrendingDown } from 'lucide-react';

interface CategoryBreakdown {
    category: string; due: number; paid: number; balance: number;
}
interface OutstandingStudent {
    student_name: string; class: string; total_due: number;
    total_paid: number; balance: number;
    category_breakdown: CategoryBreakdown[];
}
interface Filters { class_id: string; category_id: string; }
interface Summary { total_outstanding: number; student_count: number; }
interface Props {
    linked: boolean; outstanding: OutstandingStudent[];
    filters: Filters; summary: Summary;
}

export default function AccountantOutstanding({ linked, outstanding, filters, summary }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Outstanding Fees">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <AlertTriangle className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const sorted = [...outstanding].sort((a, b) => b.balance - a.balance);

    return (
        <AppLayout title="Outstanding Fees">
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Outstanding Fees</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Students with pending fee balances</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                                    <DollarSign className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-slate-900 dark:text-white">Le {summary.total_outstanding.toLocaleString()}</p>
                                    <p className="text-xs text-slate-500">Total Outstanding</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                                    <Users className="w-5 h-5 text-rose-600" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-slate-900 dark:text-white">{summary.student_count}</p>
                                    <p className="text-xs text-slate-500">Students with Outstanding</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <TrendingDown className="w-4 h-4 text-amber-500" /> Outstanding Students
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Class</TableHead>
                                    <TableHead>Total Due</TableHead>
                                    <TableHead>Total Paid</TableHead>
                                    <TableHead>Balance</TableHead>
                                    <TableHead>Breakdown</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sorted.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-slate-400">No outstanding fees. All clear!</TableCell>
                                    </TableRow>
                                ) : (
                                    sorted.map((s, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-medium">{s.student_name}</TableCell>
                                            <TableCell>{s.class}</TableCell>
                                            <TableCell>Le {s.total_due.toLocaleString()}</TableCell>
                                            <TableCell className="text-green-600 dark:text-green-400">Le {s.total_paid.toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Badge className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                    Le {s.balance.toLocaleString()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {s.category_breakdown.map((cb, ci) => (
                                                        cb.balance > 0 && (
                                                            <Badge key={ci} variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400">
                                                                {cb.category}: Le {cb.balance.toLocaleString()}
                                                            </Badge>
                                                        )
                                                    ))}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
