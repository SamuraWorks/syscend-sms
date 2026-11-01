import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardCheck, CalendarDays, CheckCircle, XCircle, Clock } from 'lucide-react';
import ParentChildSwitcher from '@/components/ParentChildSwitcher';

interface DayEntry { date: string; status: string; }
interface MonthData { label: string; total: number; present: number; absent: number; late: number; percentage: number; calendar: DayEntry[]; }
interface Child { id: number; full_name: string; class: string | null; section: string | null; months: MonthData[]; }
interface Props { linked: boolean; guardian: { name: string } | null; children: Child[]; childrenIndex?: { id: number; full_name: string }[]; selectedChild?: string | null; }

const STATUS_COLOR: Record<string, string> = {
    present: 'bg-green-500', absent: 'bg-red-500', late: 'bg-amber-400',
};

export default function ParentAttendance({ linked, children, childrenIndex, selectedChild }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Children Attendance">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <ClipboardCheck className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Account Not Linked</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm">Link your account to a school to view attendance.</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Children Attendance">
            <div className="space-y-8">
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                        <ClipboardCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-[180px]">
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Children Attendance</h1>
                        <p className="text-sm text-slate-500">Last 3 months attendance overview</p>
                    </div>
                    <ParentChildSwitcher childrenIndex={childrenIndex} selectedChild={selectedChild} />
                </div>

                {children.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <ClipboardCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-400 text-sm">No children linked to your account.</p>
                        </CardContent>
                    </Card>
                ) : (
                    children.map(child => (
                        <div key={child.id}>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                        {child.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{child.full_name}</p>
                                    <p className="text-xs text-slate-500">{child.class}{child.section ? ` — ${child.section}` : ''}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {child.months.map(m => (
                                    <Card key={m.label}>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="flex items-center justify-between text-sm">
                                                <span className="flex items-center gap-2">
                                                    <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                                                    {m.label}
                                                </span>
                                                <span className={cn(
                                                    'text-xs font-bold px-2 py-0.5 rounded-full',
                                                    m.percentage >= 75 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : m.percentage >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                )}>
                                                    {m.percentage}%
                                                </span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-center">
                                                <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-2">
                                                    <CheckCircle className="w-3.5 h-3.5 text-green-500 mx-auto mb-0.5" />
                                                    <p className="text-xs font-bold text-green-700 dark:text-green-400">{m.present}</p>
                                                    <p className="text-[10px] text-slate-500">Present</p>
                                                </div>
                                                <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-2">
                                                    <XCircle className="w-3.5 h-3.5 text-red-500 mx-auto mb-0.5" />
                                                    <p className="text-xs font-bold text-red-700 dark:text-red-400">{m.absent}</p>
                                                    <p className="text-[10px] text-slate-500">Absent</p>
                                                </div>
                                                <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-2">
                                                    <Clock className="w-3.5 h-3.5 text-amber-500 mx-auto mb-0.5" />
                                                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400">{m.late}</p>
                                                    <p className="text-[10px] text-slate-500">Late</p>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            'h-full rounded-full transition-all',
                                                            m.percentage >= 75 ? 'bg-green-500'
                                                                : m.percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                                        )}
                                                        style={{ width: `${m.percentage}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-1">
                                                {m.calendar.map((d, i) => (
                                                    <div
                                                        key={i}
                                                        title={`${d.date}: ${d.status}`}
                                                        className={cn('w-3.5 h-3.5 rounded-sm', STATUS_COLOR[d.status] ?? 'bg-slate-200 dark:bg-slate-700')}
                                                    />
                                                ))}
                                            </div>

                                            <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1">
                                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500" /> Present</span>
                                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500" /> Absent</span>
                                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-400" /> Late</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </AppLayout>
    );
}
