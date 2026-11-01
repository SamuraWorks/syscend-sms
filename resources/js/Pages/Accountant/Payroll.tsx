import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, DollarSign, CheckCircle, Clock } from 'lucide-react';

interface PayrollRecord {
    id: number; staff_name: string; basic_salary: number;
    allowances: number; deductions: number; net_salary: number;
    status: string; month: string;
}
interface Summary { total_amount: number; total_paid: number; total_pending: number; }
interface Props {
    linked: boolean; payrolls: PayrollRecord[]; summary: Summary;
}

const statusBadge: Record<string, string> = {
    paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    processed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

export default function AccountantPayroll({ linked, payrolls, summary }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Payroll">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Users className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const summaryCards = [
        { label: 'Total Amount', value: summary.total_amount, icon: DollarSign, color: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600' },
        { label: 'Total Paid', value: summary.total_paid, icon: CheckCircle, color: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600' },
        { label: 'Total Pending', value: summary.total_pending, icon: Clock, color: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600' },
    ];

    return (
        <AppLayout title="Payroll">
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Payroll</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Staff salary and payment management</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {summaryCards.map(s => (
                        <Card key={s.label}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', s.color)}>
                                        <s.icon className={cn('w-5 h-5', s.iconColor)} />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-slate-900 dark:text-white">Le {s.value.toLocaleString()}</p>
                                        <p className="text-xs text-slate-500">{s.label}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <Users className="w-4 h-4 text-emerald-500" /> Payroll Records
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Staff Name</TableHead>
                                    <TableHead>Month</TableHead>
                                    <TableHead>Basic Salary</TableHead>
                                    <TableHead>Allowances</TableHead>
                                    <TableHead>Deductions</TableHead>
                                    <TableHead>Net Salary</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payrolls.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-slate-400">No payroll records found.</TableCell>
                                    </TableRow>
                                ) : (
                                    payrolls.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-medium">{p.staff_name}</TableCell>
                                            <TableCell>{p.month}</TableCell>
                                            <TableCell>Le {p.basic_salary.toLocaleString()}</TableCell>
                                            <TableCell className="text-green-600 dark:text-green-400">+ Le {p.allowances.toLocaleString()}</TableCell>
                                            <TableCell className="text-red-500">- Le {p.deductions.toLocaleString()}</TableCell>
                                            <TableCell className="font-semibold">Le {p.net_salary.toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Badge className={cn('text-[10px] capitalize', statusBadge[p.status] ?? '')}>{p.status}</Badge>
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
