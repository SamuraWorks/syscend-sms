import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, User, Clock, MapPin, GraduationCap } from 'lucide-react';

interface Teacher {
    full_name: string;
    email: string | null;
}

interface TimetableSlot {
    day: string;
    start_time: string;
    end_time: string;
    room: string | null;
}

interface Subject {
    id: number;
    subject_name: string;
    subject_code: string | null;
    subject_type: 'compulsory' | 'elective' | 'selective';
    class_name: string | null;
    section_name: string | null;
    teacher: Teacher | null;
    timetable: TimetableSlot[];
}

interface Props {
    linked: boolean;
    student: { full_name: string; class: string | null; section: string | null } | null;
    subjects: Subject[];
}

const TYPE_COLORS: Record<string, string> = {
    compulsory: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    elective:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    selective:  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
};

const DAY_LABELS: Record<string, string> = {
    monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

export default function StudentSubjects({ linked, student, subjects }: Props) {
    if (!linked) {
        return (
            <AppLayout title="My Subjects">
                <Head title="My Subjects" />
                <Card>
                    <CardContent className="p-10 text-center">
                        <GraduationCap className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Account Not Linked</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Your student account has not been linked yet. Please contact your school administrator.
                        </p>
                    </CardContent>
                </Card>
            </AppLayout>
        );
    }

    const compulsory = subjects.filter(s => s.subject_type === 'compulsory');
    const electives  = subjects.filter(s => s.subject_type === 'elective');
    const selective  = subjects.filter(s => s.subject_type === 'selective');

    return (
        <AppLayout title="My Subjects">
            <Head title="My Subjects" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Subjects</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {student?.class}{student?.section ? ` — ${student.section}` : ''} • {subjects.length} subject{subjects.length !== 1 ? 's' : ''} registered
                    </p>
                </div>

                {subjects.length === 0 ? (
                    <Card>
                        <CardContent className="p-10 text-center">
                            <BookOpen className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No Subjects Registered</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Subject registration has not been completed for your class yet.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {compulsory.length > 0 && (
                            <Section title="Compulsory Subjects" count={compulsory.length} subjects={compulsory} />
                        )}
                        {electives.length > 0 && (
                            <Section title="Elective Subjects" count={electives.length} subjects={electives} />
                        )}
                        {selective.length > 0 && (
                            <Section title="Selective Subjects" count={selective.length} subjects={selective} />
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function Section({ title, count, subjects }: { title: string; count: number; subjects: Subject[] }) {
    return (
        <div>
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                {title} ({count})
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {subjects.map(subject => (
                    <SubjectCard key={subject.id} subject={subject} />
                ))}
            </div>
        </div>
    );
}

function SubjectCard({ subject }: { subject: Subject }) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{subject.subject_name}</h3>
                        {subject.subject_code && (
                            <p className="text-xs text-slate-400 font-mono">{subject.subject_code}</p>
                        )}
                    </div>
                    <Badge variant="outline" className={TYPE_COLORS[subject.subject_type]}>
                        {subject.subject_type}
                    </Badge>
                </div>

                {subject.teacher && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mt-2">
                        <User className="w-3 h-3" />
                        <span>{subject.teacher.full_name}</span>
                    </div>
                )}

                {subject.timetable.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1">
                            <Clock className="w-3 h-3" /> Schedule
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {subject.timetable.map((slot, i) => (
                                <span key={i} className="text-[10px] bg-slate-100 dark:bg-slate-800 rounded px-1.5 py-0.5 text-slate-600 dark:text-slate-400">
                                    {DAY_LABELS[slot.day] ?? slot.day} {slot.start_time}–{slot.end_time}
                                    {slot.room && <span className="ml-1">({slot.room})</span>}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
