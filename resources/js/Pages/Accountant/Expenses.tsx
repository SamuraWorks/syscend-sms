import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Receipt, DollarSign, TrendingDown, Tag } from 'lucide-react';

interface Expense {
    id: number; description: string; category: string;
    amount: number; date: string; vendor: string;
}
interface MonthlyTotal { month: string; total: number; }
interface CategoryTotal { category: string; total: number; count: number; }
interface Props {
    linked: boolean; expenses: Expense[];
    monthlyTotals: MonthlyTotal[]; categoryTotals: CategoryTotal[];
}

export default function AccountantExpenses({ linked, expenses, monthlyTotals, categoryTotals }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Expenses">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Receipt className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

    return (
        <AppLayout title="Expenses">
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Expenses</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Track and manage school expenditures</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                                    <DollarSign className="w-5 h-5 text-rose-600" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-slate-900 dark:text-white">Le {totalExpense.toLocaleString()}</p>
                                    <p className="text-xs text-slate-500">Total Expenses ({expenses.length} records)</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                                    <Tag className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-slate-900 dark:text-white">{categoryTotals.length}</p>
                                    <p className="text-xs text-slate-500">Expense Categories</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <Receipt className="w-4 h-4 text-rose-500" /> Expense Records
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Vendor</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {expenses.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-slate-400">No expenses recorded.</TableCell>
                                            </TableRow>
                                        ) : (
                                            expenses.map(e => (
                                                <TableRow key={e.id}>
                                                    <TableCell className="font-medium">{e.description}</TableCell>
                                                    <TableCell><Badge variant="secondary" className="text-[10px]">{e.category}</Badge></TableCell>
                                                    <TableCell className="text-slate-500">{e.vendor}</TableCell>
                                                    <TableCell className="font-semibold text-red-600 dark:text-red-400">Le {e.amount.toLocaleString()}</TableCell>
                                                    <TableCell className="text-xs text-slate-500">{e.date}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <Tag className="w-4 h-4 text-amber-500" /> By Category
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {categoryTotals.length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-4">No data.</p>
                                ) : (
                                    <ul className="space-y-2.5">
                                        {categoryTotals.map((c, i) => (
                                            <li key={i} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                                                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{c.category}</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Le {c.total.toLocaleString()}</p>
                                                    <p className="text-[11px] text-slate-400">{c.count} items</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <TrendingDown className="w-4 h-4 text-blue-500" /> Monthly Totals
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {monthlyTotals.length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-4">No data.</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {monthlyTotals.map((m, i) => (
                                            <li key={i} className="flex items-center justify-between text-sm">
                                                <span className="text-slate-600 dark:text-slate-400">{m.month}</span>
                                                <span className="font-medium text-slate-800 dark:text-slate-200">Le {m.total.toLocaleString()}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
