import { useState } from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ClipboardList, CalendarDays, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface ClassRow { id: number; name: string; }
interface SectionRow { id: number; name: string; class_id: number; }
interface DayRecord { date: string; present: number; absent: number; late: number; }
interface Props {
    linked: boolean;
    teacher: { full_name: string; is_form_master: boolean };
    classes: ClassRow[];
    sections: SectionRow[];
    recentAttendance: DayRecord[];
}

export default function Attendance({ linked, teacher, classes, sections, recentAttendance }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Attendance">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <ClipboardList className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const [classId, setClassId] = useState<string>('');
    const [sectionId, setSectionId] = useState<string>('');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');

    const filteredSections = classId
        ? sections.filter(s => s.class_id === Number(classId))
        : [];

    const filtered = recentAttendance.filter(d => {
        if (dateFrom && d.date < dateFrom) return false;
        if (dateTo && d.date > dateTo) return false;
        return true;
    });

    function handleTakeAttendance() {
        const params = new URLSearchParams();
        if (classId) params.set('class_id', classId);
        if (sectionId) params.set('section_id', sectionId);
        router.get(`/school/teacher/attendance/take?${params.toString()}`);
    }

    return (
        <AppLayout title="Attendance">
            <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Attendance</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            {teacher.full_name} — {teacher.is_form_master ? 'Form Master' : 'Class Teacher'}
                        </p>
                    </div>
                    {teacher.is_form_master && (
                        <Button onClick={handleTakeAttendance} className="bg-indigo-600 hover:bg-indigo-700 text-white inline-flex items-center gap-2">
                            <ClipboardList className="w-4 h-4" /> Take Attendance
                        </Button>
                    )}
                </div>

                <Card className="border-slate-200 dark:border-slate-800">
                    <CardContent className="p-4">
                        <div className="flex flex-wrap gap-3 items-end">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Class</label>
                                <select
                                    value={classId}
                                    onChange={e => { setClassId(e.target.value); setSectionId(''); }}
                                    className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                                >
                                    <option value="">All Classes</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Section</label>
                                <select
                                    value={sectionId}
                                    onChange={e => setSectionId(e.target.value)}
                                    className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                                >
                                    <option value="">All Sections</option>
                                    {filteredSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">From</label>
                                <Input type="date" className="w-40 h-8" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">To</label>
                                <Input type="date" className="w-40 h-8" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 dark:bg-slate-900">
                                <TableHead>Date</TableHead>
                                <TableHead className="text-center">Present</TableHead>
                                <TableHead className="text-center">Absent</TableHead>
                                <TableHead className="text-center">Late</TableHead>
                                <TableHead className="text-center">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-16 text-slate-400">
                                        No attendance records found.
                                    </TableCell>
                                </TableRow>
                            ) : filtered.map((day, idx) => (
                                <TableRow key={idx}>
                                    <TableCell className="font-medium text-slate-900 dark:text-white text-sm">
                                        <div className="flex items-center gap-2">
                                            <CalendarDays className="w-4 h-4 text-slate-400" />
                                            {new Date(day.date).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="inline-flex items-center gap-1 text-sm text-green-600 font-medium">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> {day.present}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="inline-flex items-center gap-1 text-sm text-red-500 font-medium">
                                            <XCircle className="w-3.5 h-3.5" /> {day.absent}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="inline-flex items-center gap-1 text-sm text-amber-600 font-medium">
                                            <Clock className="w-3.5 h-3.5" /> {day.late}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        {day.present + day.absent + day.late}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AppLayout>
    );
}
