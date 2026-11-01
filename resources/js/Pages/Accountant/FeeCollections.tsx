import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Wallet, CalendarDays, CalendarRange, TrendingUp, ChevronDown,
} from 'lucide-react';

interface CollectionPayment {
    student_name: string; class: string; amount: number; category: string; time: string;
}
interface DayCollection {
    date: string; total: number; count: number; payments: CollectionPayment[];
}
interface Props {
    linked: boolean; collections: DayCollection[];
    dailyTotals: { total: number; count: number };
    monthlyTotals: { total: number; count: number };
    termTotals: { total: number; count: number };
}

export default function AccountantFeeCollections({
    linked, collections, dailyTotals, monthlyTotals, termTotals,
}: Props) {
    if (!linked) {
        return (
            <AppLayout title="Fee Collections">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Wallet className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const summaryCards = [
        { label: 'Today', total: dailyTotals.total, count: dailyTotals.count, icon: CalendarDays, color: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600' },
        { label: 'This Month', total: monthlyTotals.total, count: monthlyTotals.count, icon: CalendarRange, color: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600' },
        { label: 'This Term', total: termTotals.total, count: termTotals.count, icon: TrendingUp, color: 'bg-violet-100 dark:bg-violet-900/30', iconColor: 'text-violet-600' },
    ];

    return (
        <AppLayout title="Fee Collections">
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Fee Collections</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Daily collection records and summaries</p>
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
                                        <p className="text-xl font-bold text-slate-900 dark:text-white">Le {s.total.toLocaleString()}</p>
                                        <p className="text-xs text-slate-500">{s.label} · {s.count} transaction{s.count !== 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {collections.length === 0 ? (
                    <Card><CardContent className="py-16 text-center text-slate-400">No collection records found.</CardContent></Card>
                ) : (
                    <div className="space-y-4">
                        {collections.map((day, di) => (
                            <Card key={di}>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        <span className="flex items-center gap-2">
                                            <CalendarDays className="w-4 h-4 text-emerald-500" /> {day.date}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="text-[10px]">{day.count} payment{day.count !== 1 ? 's' : ''}</Badge>
                                            <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Le {day.total.toLocaleString()}</Badge>
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {day.payments.map((p, pi) => (
                                            <div key={pi} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{p.student_name.charAt(0)}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{p.student_name}</p>
                                                    <p className="text-xs text-slate-400">{p.class} · {p.category}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Le {p.amount.toLocaleString()}</p>
                                                    <p className="text-[11px] text-slate-400">{p.time}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
