import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    BarChart3, DollarSign, TrendingUp, TrendingDown, Users, CreditCard,
} from 'lucide-react';

interface FinancialSummary {
    income: number; expenses: number; net: number;
}
interface MonthlyCollection {
    month: string; collected: number; outstanding: number;
}
interface PayrollSummaryItem {
    label: string; value: number;
}
interface Props {
    linked: boolean;
    financialSummary: FinancialSummary;
    collectionRate: number;
    outstandingRatio: number;
    monthlyCollection: MonthlyCollection[];
    payrollSummary: PayrollSummaryItem[];
}

export default function AccountantReports({
    linked, financialSummary, collectionRate, outstandingRatio,
    monthlyCollection, payrollSummary,
}: Props) {
    if (!linked) {
        return (
            <AppLayout title="Financial Reports">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <BarChart3 className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const maxCollected = Math.max(...monthlyCollection.map(m => m.collected), 1);

    return (
        <AppLayout title="Financial Reports">
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Financial Reports</h1>
                    <p className="text-sm text-slate-500 mt-0.5">School financial overview and analytics</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-slate-900 dark:text-white">Le {financialSummary.income.toLocaleString()}</p>
                                    <p className="text-xs text-slate-500">Total Income</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                                    <TrendingDown className="w-5 h-5 text-rose-600" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-slate-900 dark:text-white">Le {financialSummary.expenses.toLocaleString()}</p>
                                    <p className="text-xs text-slate-500">Total Expenses</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', financialSummary.net >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-rose-100 dark:bg-rose-900/30')}>
                                    <DollarSign className={cn('w-5 h-5', financialSummary.net >= 0 ? 'text-emerald-600' : 'text-rose-600')} />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-slate-900 dark:text-white">Le {financialSummary.net.toLocaleString()}</p>
                                    <p className="text-xs text-slate-500">Net Balance</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <CreditCard className="w-4 h-4 text-emerald-500" /> Collection Rate
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min(collectionRate, 100)}%` }} />
                                    </div>
                                </div>
                                <span className="text-2xl font-bold text-slate-900 dark:text-white">{collectionRate}%</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">Fee collection efficiency rate</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <TrendingDown className="w-4 h-4 text-amber-500" /> Outstanding Ratio
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${Math.min(outstandingRatio, 100)}%` }} />
                                    </div>
                                </div>
                                <span className="text-2xl font-bold text-slate-900 dark:text-white">{outstandingRatio}%</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">Percentage of fees still outstanding</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <BarChart3 className="w-4 h-4 text-blue-500" /> Monthly Collection Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {monthlyCollection.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-4">No monthly data available.</p>
                        ) : (
                            <div className="space-y-3">
                                {monthlyCollection.map((m, i) => (
                                    <div key={i} className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium text-slate-700 dark:text-slate-300">{m.month}</span>
                                            <div className="flex items-center gap-3 text-xs">
                                                <span className="text-emerald-600 dark:text-emerald-400">Le {m.collected.toLocaleString()}</span>
                                                <span className="text-amber-600 dark:text-amber-400">Le {m.outstanding.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 h-2">
                                            <div className="bg-emerald-500 rounded-l-full" style={{ width: `${maxCollected > 0 ? (m.collected / maxCollected) * 100 : 0}%` }} />
                                            <div className="bg-amber-400 rounded-r-full" style={{ width: `${maxCollected > 0 ? (m.outstanding / maxCollected) * 100 : 0}%` }} />
                                        </div>
                                    </div>
                                ))}
                                <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Collected</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Outstanding</span>
                                </div>
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
                    <CardContent>
                        {payrollSummary.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-4">No payroll data.</p>
                        ) : (
                            <div className="space-y-2">
                                {payrollSummary.map((p, i) => (
                                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{p.label}</span>
                                        <span className="text-sm font-semibold text-slate-900 dark:text-white">Le {p.value.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
