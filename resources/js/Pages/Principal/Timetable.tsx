import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, ChevronRight, Users, AlertTriangle } from 'lucide-react';

interface TimetableSlot {
    subject: string;
    class: string;
    section: string;
    teacher: string | null;
    start_time: string;
    end_time: string;
    room: string | null;
}
interface TeacherLoad { teacher: string; slots: number; }
interface Conflict { teacher: string; day: string; start_time: string; end_time: string; }
interface Props {
    linked: boolean;
    principal: { full_name: string };
    timetable: Record<string, TimetableSlot[]>;
    teacherLoad: TeacherLoad[];
    conflicts: Conflict[];
    today: string;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export default function Timetable({ linked, timetable, teacherLoad, conflicts, today }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Timetable">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Clock className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const totalSlots = Object.values(timetable).reduce((sum, slots) => sum + slots.length, 0);
    const orderedDays = [...DAYS, ...Object.keys(timetable).filter(d => !DAYS.includes(d))];

    return (
        <AppLayout title="Timetable">
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/school/principal/dashboard" className="hover:text-slate-700 dark:hover:text-slate-300">Principal</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Timetable</span>
                </div>

                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-indigo-500" /> Timetable
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        School-wide schedule · {totalSlots} {totalSlots === 1 ? 'period' : 'periods'} per week
                        {conflicts.length > 0 && (
                            <span className="text-red-500 font-medium"> · {conflicts.length} {conflicts.length === 1 ? 'conflict' : 'conflicts'}</span>
                        )}
                    </p>
                </div>

                {totalSlots === 0 ? (
                    <Card><CardContent className="py-16 text-center"><Clock className="w-10 h-10 mx-auto mb-3 text-slate-300" /><p className="text-sm text-slate-400">No timetable data available.</p></CardContent></Card>
                ) : (
                    <div className="space-y-4">
                        {orderedDays.map(day => {
                            const slots = timetable[day];
                            if (!slots || slots.length === 0) return null;
                            const sorted = [...slots].sort((a, b) => a.start_time.localeCompare(b.start_time));
                            const isToday = day.toLowerCase() === today.toLowerCase();
                            return (
                                <Card key={day} className={cn(isToday && 'ring-1 ring-indigo-200 dark:ring-indigo-800')}>
                                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 capitalize">{day}</h2>
                                        <div className="flex items-center gap-2">
                                            {isToday && <Badge className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border-0">Today</Badge>}
                                            <Badge variant="outline" className="text-[10px]">{slots.length}</Badge>
                                        </div>
                                    </div>
                                    <CardContent className="p-0">
                                        <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                            {sorted.map((s, i) => (
                                                <div key={i} className="flex items-center gap-4 px-4 py-3">
                                                    <div className="w-20 shrink-0">
                                                        <p className="text-xs font-mono text-slate-500">{s.start_time}</p>
                                                        <p className="text-[10px] text-slate-400">to {s.end_time}</p>
                                                    </div>
                                                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{s.subject}</p>
                                                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                                                            <span>{s.class}{s.section ? ` · ${s.section}` : ''}</span>
                                                            {s.teacher && <span>· {s.teacher}</span>}
                                                            {s.room && <span>· Room {s.room}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card>
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                            <Users className="w-4 h-4 text-violet-500" />
                            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Teacher Load</h2>
                        </div>
                        <CardContent className="p-0">
                            {teacherLoad.length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-8">No teacher load data.</p>
                            ) : (
                                <div className="divide-y divide-slate-50 dark:divide-slate-800/50 max-h-80 overflow-y-auto">
                                    {teacherLoad.map(t => (
                                        <div key={t.teacher} className="flex items-center justify-between px-4 py-2.5">
                                            <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{t.teacher}</p>
                                            <Badge variant="secondary" className={cn('text-[10px]', t.slots > 25 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500')}>
                                                {t.slots} {t.slots === 1 ? 'slot' : 'slots'}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                            <AlertTriangle className={cn('w-4 h-4', conflicts.length > 0 ? 'text-red-500' : 'text-slate-400')} />
                            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Conflicts</h2>
                            {conflicts.length > 0 && <Badge className="ml-auto text-[10px] bg-red-100 text-red-600 border-0">{conflicts.length}</Badge>}
                        </div>
                        <CardContent className="p-0">
                            {conflicts.length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-8">No scheduling conflicts found.</p>
                            ) : (
                                <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                    {conflicts.map((c, i) => (
                                        <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                                            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{c.teacher}</p>
                                                <p className="text-xs text-slate-400 capitalize">{c.day} · {c.start_time} – {c.end_time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
