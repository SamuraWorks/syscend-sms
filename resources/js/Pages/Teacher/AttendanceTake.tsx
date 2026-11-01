import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ClipboardList, Save, CheckCircle2, XCircle, Clock, Shield, Stethoscope } from 'lucide-react';

interface Student { id: number; full_name: string; admission_no: string; photo_url: string | null; }
interface ClassRow { id: number; name: string; }
interface SectionRow { id: number; name: string; class_id: number; }
interface Props {
    linked: boolean;
    teacher: { full_name: string; is_form_master: boolean };
    students: Student[];
    existing: Record<string, string>;
    date: string;
    classId: number;
    sectionId: number | null;
    classes: ClassRow[];
    sections: SectionRow[];
}

const STATUSES = [
    { value: 'present', label: 'Present', color: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700', icon: CheckCircle2 },
    { value: 'absent', label: 'Absent', color: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700', icon: XCircle },
    { value: 'late', label: 'Late', color: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700', icon: Clock },
    { value: 'excused', label: 'Excused', color: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700', icon: Shield },
    { value: 'medical_leave', label: 'Medical Leave', color: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700', icon: Stethoscope },
];

export default function AttendanceTake({ linked, teacher, students, existing, date, classId, sectionId, classes, sections }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Take Attendance">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <ClipboardList className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const [selectedDate, setSelectedDate] = useState(date);
    const [selectedClassId, setSelectedClassId] = useState<string>(String(classId));
    const [selectedSectionId, setSelectedSectionId] = useState<string>(sectionId ? String(sectionId) : '');
    const [records, setRecords] = useState<Record<number, string>>(() => {
        const init: Record<number, string> = {};
        students.forEach(s => {
            init[s.id] = existing[String(s.id)] ?? 'present';
        });
        return init;
    });
    const [saving, setSaving] = useState(false);

    const filteredSections = selectedClassId
        ? sections.filter(s => s.class_id === Number(selectedClassId))
        : [];

    function setStudentStatus(studentId: number, status: string) {
        setRecords(prev => ({ ...prev, [studentId]: status }));
    }

    function handleClassChange(value: string) {
        setSelectedClassId(value);
        setSelectedSectionId('');
    }

    function handleNavigate() {
        const params = new URLSearchParams();
        if (selectedClassId) params.set('class_id', selectedClassId);
        if (selectedSectionId) params.set('section_id', selectedSectionId);
        if (selectedDate) params.set('date', selectedDate);
        router.get(`/school/teacher/attendance/take?${params.toString()}`);
    }

    function handleSave() {
        setSaving(true);
        const payload = {
            date: selectedDate,
            class_id: Number(selectedClassId),
            section_id: selectedSectionId ? Number(selectedSectionId) : null,
            records: students.map(s => ({
                student_id: s.id,
                status: records[s.id] ?? 'present',
            })),
        };
        router.post('/school/teacher/attendance/store', payload, {
            preserveScroll: true,
            onSuccess: () => { toast.success('Attendance saved successfully'); },
            onFinish: () => setSaving(false),
        });
    }

    const presentCount = Object.values(records).filter(r => r === 'present').length;
    const absentCount = Object.values(records).filter(r => r === 'absent').length;
    const lateCount = Object.values(records).filter(r => r === 'late').length;

    return (
        <AppLayout title="Take Attendance">
            <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Take Attendance</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{teacher.full_name}</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/school/teacher/attendance">
                            <Button variant="outline" className="inline-flex items-center gap-2">
                                <ClipboardList className="w-4 h-4" /> View Records
                            </Button>
                        </Link>
                    </div>
                </div>

                <Card className="border-slate-200 dark:border-slate-800">
                    <CardContent className="p-4">
                        <div className="flex flex-wrap gap-3 items-end">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Date</label>
                                <Input type="date" className="w-44 h-8" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Class</label>
                                <select
                                    value={selectedClassId}
                                    onChange={e => handleClassChange(e.target.value)}
                                    className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                                >
                                    <option value="">Select class</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            {filteredSections.length > 0 && (
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Section</label>
                                    <select
                                        value={selectedSectionId}
                                        onChange={e => setSelectedSectionId(e.target.value)}
                                        className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                                    >
                                        <option value="">All Sections</option>
                                        {filteredSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            )}
                            <Button variant="outline" size="sm" onClick={handleNavigate} className="h-8">Load Students</Button>
                        </div>
                    </CardContent>
                </Card>

                {students.length > 0 && (
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex gap-4">
                            <div className="text-center">
                                <p className="text-xl font-bold text-green-600">{presentCount}</p>
                                <p className="text-xs text-slate-400">Present</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-bold text-red-500">{absentCount}</p>
                                <p className="text-xs text-slate-400">Absent</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-bold text-amber-600">{lateCount}</p>
                                <p className="text-xs text-slate-400">Late</p>
                            </div>
                        </div>
                        <div className="ml-auto">
                            <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white inline-flex items-center gap-2">
                                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Attendance'}
                            </Button>
                        </div>
                    </div>
                )}

                {students.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-center py-20">
                        <div className="text-center">
                            <ClipboardList className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                            <p className="text-slate-500 dark:text-slate-400">Select a class and section, then click "Load Students"</p>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 dark:bg-slate-900">
                                    <TableHead className="w-12">#</TableHead>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Admission No</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.map((student, idx) => {
                                    const currentStatus = records[student.id] ?? 'present';
                                    return (
                                        <TableRow key={student.id}>
                                            <TableCell className="text-slate-400 text-sm">{idx + 1}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {student.photo_url ? (
                                                        <img src={student.photo_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                                                            {student.full_name[0]}
                                                        </div>
                                                    )}
                                                    <span className="text-sm font-medium text-slate-900 dark:text-white">{student.full_name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-500 text-sm">{student.admission_no}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-1.5 flex-wrap">
                                                    {STATUSES.map(opt => {
                                                        const Icon = opt.icon;
                                                        return (
                                                            <button
                                                                key={opt.value}
                                                                type="button"
                                                                onClick={() => setStudentStatus(student.id, opt.value)}
                                                                className={cn(
                                                                    'px-2.5 py-1 rounded-full text-xs font-medium border transition-all inline-flex items-center gap-1',
                                                                    currentStatus === opt.value
                                                                        ? opt.color + ' ring-2 ring-offset-1 ring-current'
                                                                        : 'bg-slate-50 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800',
                                                                )}
                                                            >
                                                                <Icon className="w-3 h-3" />
                                                                {opt.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {students.length > 0 && (
                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 inline-flex items-center gap-2">
                            <Save className="w-4 h-4" /> {saving ? 'Saving...' : `Save Attendance (${students.length} students)`}
                        </Button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
