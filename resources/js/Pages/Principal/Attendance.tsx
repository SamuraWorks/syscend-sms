import { useState } from 'react';
import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarCheck, ChevronRight, CheckCircle2, XCircle, Clock, Users } from 'lucide-react';

interface ByClass { class: string; present_pct: number; total_records: number; }
interface Trend { date: string; present: number; absent: number; late: number; }
interface Props {
    linked: boolean;
    principal: { full_name: string };
    monthlySummary: { present?: number; absent?: number; late?: number };
    attendanceByClass: ByClass[];
    recentTrends: Trend[];
}

export default function Attendance({ linked, principal, monthlySummary, attendanceByClass, recentTrends }: Props) {
    const [selectedClass, setSelectedClass] = useState('all');

    if (!linked) {
        return (
            <AppLayout title="Attendance">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <CalendarCheck className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const present = monthlySummary?.present ?? 0;
    const absent = monthlySummary?.absent ?? 0;
    const late = monthlySummary?.late ?? 0;
    const total = present + absent + late;
    const rate = total > 0 ? Math.round(present / total * 100) : 0;

    const filteredClasses = selectedClass === 'all'
        ? attendanceByClass
        : attendanceByClass.filter(c => c.class === selectedClass);

    return (
        <AppLayout title="Attendance">
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/school/principal/dashboard" className="hover:text-slate-700 dark:hover:text-slate-300">Principal</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Attendance</span>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <CalendarCheck className="w-5 h-5 text-green-500" /> Attendance
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5">Monthly attendance overview</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={selectedClass} onValueChange={v => setSelectedClass(v)}>
                            <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="All Classes" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Classes</SelectItem>
                                {attendanceByClass.map(c => (
                                    <SelectItem key={c.class} value={c.class}>{c.class}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-100 dark:bg-green-900/30"><CheckCircle2 className="w-4 h-4 text-green-600" /></div>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{present.toLocaleString()}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Present</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-100 dark:bg-red-900/30"><XCircle className="w-4 h-4 text-red-600" /></div>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{absent.toLocaleString()}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Absent</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-100 dark:bg-amber-900/30"><Clock className="w-4 h-4 text-amber-600" /></div>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{late.toLocaleString()}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Late</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/30"><Users className="w-4 h-4 text-indigo-600" /></div>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{rate}%</p>
                            <p className="text-xs text-slate-500 mt-0.5">Attendance Rate</p>
                        </CardContent>
                    </Card>
                </div>

                {filteredClasses.length > 0 ? (
                    <Card>
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Attendance by Class (This Month)</h2>
                        </div>
                        <CardContent className="p-0">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-xs uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                        <th className="text-left py-3 px-4 font-medium">Class</th>
                                        <th className="text-center py-3 px-4 font-medium">Total Records</th>
                                        <th className="text-center py-3 px-4 font-medium">Present %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredClasses.map(c => (
                                        <tr key={c.class} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{c.class}</td>
                                            <td className="py-3 px-4 text-center text-slate-500">{c.total_records}</td>
                                            <td className="py-3 px-4 text-center">
                                                <Badge variant="outline" className={cn('text-[10px]', c.present_pct >= 80 ? 'text-green-600' : c.present_pct >= 50 ? 'text-amber-600' : 'text-red-600')}>
                                                    {c.present_pct}%
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                ) : (
                    <Card><CardContent className="py-16 text-center"><CalendarCheck className="w-10 h-10 mx-auto mb-3 text-slate-300" /><p className="text-sm text-slate-400">No attendance data available.</p></CardContent></Card>
                )}

                {recentTrends.length > 0 && (
                    <Card>
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Daily Trends (Last 30 Days)</h2>
                        </div>
                        <CardContent className="p-0">
                            <div className="max-h-80 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-white dark:bg-slate-900">
                                        <tr className="text-xs uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                            <th className="text-left py-3 px-4 font-medium">Date</th>
                                            <th className="text-center py-3 px-4 font-medium">Present</th>
                                            <th className="text-center py-3 px-4 font-medium">Absent</th>
                                            <th className="text-center py-3 px-4 font-medium">Late</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentTrends.map(t => (
                                            <tr key={t.date} className="border-b border-slate-50 dark:border-slate-800/50">
                                                <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{t.date}</td>
                                                <td className="py-3 px-4 text-center text-green-600">{t.present}</td>
                                                <td className="py-3 px-4 text-center text-red-500">{t.absent}</td>
                                                <td className="py-3 px-4 text-center text-amber-500">{t.late}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
