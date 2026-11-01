import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, CheckCircle, XCircle, Clock } from 'lucide-react';

interface DayEntry { date: string; status: string; }
interface MonthData {
    label: string; total: number; present: number; absent: number; late: number;
    percentage: number; calendar: DayEntry[];
}
interface Props {
    linked: boolean;
    student: { full_name: string; class: string | null } | null;
    months: MonthData[];
}

const STATUS_COLOR: Record<string, string> = {
    present: 'bg-green-500',
    absent:  'bg-red-500',
    late:    'bg-amber-400',
    holiday: 'bg-slate-300 dark:bg-slate-600',
};

function MonthCard({ month }: { month: MonthData }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span>{month.label}</span>
                    <span className={cn('text-base font-bold', month.percentage >= 75 ? 'text-green-600' : month.percentage >= 50 ? 'text-amber-600' : 'text-red-600')}>
                        {month.percentage}%
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex gap-4 text-xs">
                    <span className="flex items-center gap-1 text-green-600 font-medium"><CheckCircle className="w-3 h-3" /> {month.present} Present</span>
                    <span className="flex items-center gap-1 text-red-500 font-medium"><XCircle className="w-3 h-3" /> {month.absent} Absent</span>
                    <span className="flex items-center gap-1 text-amber-600 font-medium"><Clock className="w-3 h-3" /> {month.late} Late</span>
                    <span className="text-slate-400">{month.total} Total</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full', month.percentage >= 75 ? 'bg-green-500' : month.percentage >= 50 ? 'bg-amber-500' : 'bg-red-500')}
                        style={{ width: `${month.percentage}%` }} />
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                    {month.calendar.map((d, i) => (
                        <div key={i} title={`${d.date}: ${d.status}`}
                            className={cn('w-4 h-4 rounded-sm', STATUS_COLOR[d.status] ?? 'bg-slate-200')} />
                    ))}
                </div>
                <div className="flex gap-3 text-[11px] text-slate-500">
                    {Object.entries(STATUS_COLOR).map(([s, c]) => (
                        <span key={s} className="flex items-center gap-1">
                            <span className={cn('w-2.5 h-2.5 rounded-sm inline-block', c)} />{s}
                        </span>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export default function Attendance({ linked, student, months }: Props) {
    if (!linked) {
        return (
            <AppLayout title="My Attendance">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                        <ClipboardList className="w-8 h-8 text-slate-300" />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="My Attendance">
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                        <ClipboardList className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">My Attendance</h1>
                        <p className="text-sm text-slate-500">Last 6 months &mdash; {student?.class}</p>
                    </div>
                </div>

                {months.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <ClipboardList className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                            <p className="text-sm text-slate-400">No attendance records found.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {months.map(m => <MonthCard key={m.label} month={m} />)}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
