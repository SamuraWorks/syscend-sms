import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DollarSign, TrendingUp, Wallet, Users, Percent, AlertCircle, CreditCard, ChevronRight,
} from 'lucide-react';

interface MonthlyRevenue { month: string; amount: number; }
interface CategoryBreakdown { name: string; total: number; percentage: number; }
interface PayrollSummary { total_staff: number; total_payroll: number; average_salary: number; }
interface Props {
    linked: boolean;
    monthlyRevenue: MonthlyRevenue[];
    feeByCategory: CategoryBreakdown[];
    outstandingByCategory: CategoryBreakdown[];
    payrollSummary: PayrollSummary;
    netIncome: number;
    collectionRateTrend: number;
}

export default function ProprietorFinancial({
    linked, monthlyRevenue, feeByCategory, outstandingByCategory,
    payrollSummary, netIncome, collectionRateTrend,
}: Props) {
    if (!linked) {
        return (
            <AppLayout title="Financial Overview">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <DollarSign className="w-16 h-16 text-slate-300 mb-4" />
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Account not linked</h2>
                    <p className="text-slate-500 mt-2 max-w-sm">Your user account hasn&apos;t been linked yet. Please contact the system administrator.</p>
                </div>
            </AppLayout>
        );
    }

    const maxRevenue = Math.max(...monthlyRevenue.map(r => r.amount), 1);

    const summaryCards = [
        { label: 'Net Income', value: `Le ${netIncome.toLocaleString()}`, icon: TrendingUp, color: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600' },
        { label: 'Total Payroll', value: `Le ${payrollSummary.total_payroll.toLocaleString()}`, icon: Wallet, color: 'bg-rose-100 dark:bg-rose-900/30', iconColor: 'text-rose-600' },
        { label: 'Average Salary', value: `Le ${payrollSummary.average_salary.toLocaleString()}`, icon: CreditCard, color: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600' },
        { label: 'Collection Rate', value: `${collectionRateTrend}%`, icon: Percent, color: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600' },
    ];

    return (
        <AppLayout title="Financial Overview">
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/school/proprietor/dashboard" className="hover:text-slate-700 dark:hover:text-slate-300">Proprietor</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Financial</span>
                </div>

                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-emerald-500" /> Financial Overview
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">Revenue, expenses, and payroll at a glance</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {summaryCards.map(s => (
                        <Card key={s.label}>
                            <CardContent className="p-4">
                                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-2', s.color)}>
                                    <s.icon className={cn('w-4 h-4', s.iconColor)} />
                                </div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <TrendingUp className="w-4 h-4 text-emerald-500" /> Monthly Revenue
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {monthlyRevenue.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-4">No revenue data.</p>
                            ) : (
                                <div className="flex items-end gap-1 h-48">
                                    {monthlyRevenue.map((r, i) => (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                            <span className="text-[10px] text-slate-500 font-medium">Le {(r.amount / 1000).toFixed(0)}k</span>
                                            <div
                                                className="w-full rounded-t bg-emerald-400 dark:bg-emerald-600 min-h-[2px]"
                                                style={{ height: `${(r.amount / maxRevenue) * 100}%` }}
                                            />
                                            <span className="text-[9px] text-slate-400 truncate w-full text-center">{r.month}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <DollarSign className="w-4 h-4 text-blue-500" /> Revenue by Category
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {feeByCategory.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-4">No data available.</p>
                            ) : (
                                <div className="space-y-3">
                                    {feeByCategory.map((cat, i) => (
                                        <div key={i}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm text-slate-700 dark:text-slate-300">{cat.name}</span>
                                                <span className="text-sm font-semibold text-slate-900 dark:text-white">Le {cat.total.toLocaleString()}</span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${cat.percentage}%` }} />
                                            </div>
                                            <span className="text-[10px] text-slate-400">{cat.percentage}%</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <AlertCircle className="w-4 h-4 text-rose-500" /> Outstanding by Category
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {outstandingByCategory.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-4">No outstanding fees.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-200 dark:border-slate-700">
                                                <th className="text-left py-2 text-xs font-medium text-slate-500">Category</th>
                                                <th className="text-right py-2 text-xs font-medium text-slate-500">Amount</th>
                                                <th className="text-right py-2 text-xs font-medium text-slate-500">%</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {outstandingByCategory.map((cat, i) => (
                                                <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                                                    <td className="py-2.5 text-slate-700 dark:text-slate-300">{cat.name}</td>
                                                    <td className="py-2.5 text-right font-medium text-slate-900 dark:text-white">Le {cat.total.toLocaleString()}</td>
                                                    <td className="py-2.5 text-right text-slate-500">{cat.percentage}%</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <Users className="w-4 h-4 text-violet-500" /> Payroll Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600 dark:text-slate-400">Total Staff</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{payrollSummary.total_staff}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600 dark:text-slate-400">Total Payroll</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">Le {payrollSummary.total_payroll.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600 dark:text-slate-400">Average Salary</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">Le {payrollSummary.average_salary.toLocaleString()}</span>
                            </div>
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600 dark:text-slate-400">Net Income</span>
                                    <span className={cn('text-sm font-bold', netIncome >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                                        Le {netIncome.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
