import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    CreditCard, DollarSign, TrendingUp, Filter, ChevronLeft, ChevronRight,
} from 'lucide-react';

interface Payment {
    id: number; student_name: string; class: string; category: string;
    amount_due: number; amount_paid: number; balance: number;
    payment_date: string; status: string;
}
interface Filters { class_id: string; category_id: string; status: string; }
interface ClassOption { id: number; name: string; }
interface CategoryOption { id: number; name: string; }
interface Summary { total_due: number; total_paid: number; total_balance: number; }
interface Props {
    linked: boolean; payments: Payment[];
    filters: Filters; classes: ClassOption[]; categories: CategoryOption[];
    summary: Summary;
}

const statusBadge: Record<string, string> = {
    paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    partial: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    unpaid: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function AccountantFees({ linked, payments, filters, classes, categories, summary }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Fee Management">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <CreditCard className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Fee Management">
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Fee Management</h1>
                    <p className="text-sm text-slate-500 mt-0.5">View and manage all fee payments</p>
                </div>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <Filter className="w-4 h-4" /> Filters:
                            </div>
                            <select
                                defaultValue={filters.class_id}
                                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            >
                                <option value="">All Classes</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <select
                                defaultValue={filters.category_id}
                                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            >
                                <option value="">All Categories</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <select
                                defaultValue={filters.status}
                                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            >
                                <option value="">All Status</option>
                                <option value="paid">Paid</option>
                                <option value="partial">Partial</option>
                                <option value="unpaid">Unpaid</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                    <DollarSign className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-slate-900 dark:text-white">Le {summary.total_due.toLocaleString()}</p>
                                    <p className="text-xs text-slate-500">Total Due</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-slate-900 dark:text-white">Le {summary.total_paid.toLocaleString()}</p>
                                    <p className="text-xs text-slate-500">Total Paid</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                                    <CreditCard className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-slate-900 dark:text-white">Le {summary.total_balance.toLocaleString()}</p>
                                    <p className="text-xs text-slate-500">Outstanding Balance</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <CreditCard className="w-4 h-4 text-emerald-500" /> All Payments
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Class</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Due</TableHead>
                                    <TableHead>Paid</TableHead>
                                    <TableHead>Balance</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-slate-400">No payments found.</TableCell>
                                    </TableRow>
                                ) : (
                                    payments.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-medium">{p.student_name}</TableCell>
                                            <TableCell>{p.class}</TableCell>
                                            <TableCell><Badge variant="secondary" className="text-[10px]">{p.category}</Badge></TableCell>
                                            <TableCell>Le {p.amount_due.toLocaleString()}</TableCell>
                                            <TableCell className="text-green-600 dark:text-green-400 font-medium">Le {p.amount_paid.toLocaleString()}</TableCell>
                                            <TableCell className={cn('font-medium', p.balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400')}>
                                                Le {p.balance.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-500">{p.payment_date}</TableCell>
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

                <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>Showing {payments.length} payment{payments.length !== 1 ? 's' : ''}</span>
                    <div className="flex items-center gap-2">
                        <button className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-medium">1</span>
                        <button className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
