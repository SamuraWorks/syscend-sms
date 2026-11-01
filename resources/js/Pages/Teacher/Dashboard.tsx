import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from '@inertiajs/react';
import {
    GraduationCap, Users, ClipboardCheck, BookOpen, ClipboardList, Bell,
    Calendar, CheckCircle, FileText, MessageSquare, PenTool, Clock,
    Megaphone, ChevronRight,
} from 'lucide-react';
import ProfileAvatar from '@/components/ProfileAvatar';

interface Teacher {
    id: number; full_name: string; emp_id: string; photo_url: string | null;
    designation: string | null; department: string | null;
    teacher_type: string; is_form_master: boolean; is_subject_teacher: boolean;
}
interface Subject { id: number; name: string; }
interface AssignedClass { class: string | null; section: string | null; }
interface Stats {
    classes_teaching: number; total_students: number; attendance_today: number;
    homework_pending: number; exams_awaiting_marks: number; unread_messages: number;
}
interface TimeSlot { subject: string | null; class: string | null; section: string | null; start_time: string; end_time: string; room: string | null; }
interface Exam { id: number; name: string; type: string; start_date: string | null; }
interface HW { id: number; title: string; due_date: string | null; }
interface Announcement { id: number; title: string; body: string; pinned: boolean; date: string | null; }
interface Props {
    linked: boolean; teacher: Teacher | null;
    academicYear: string | null; academicTerm: string | null;
    assignedSubjects: Subject[]; assignedClasses: AssignedClass[];
    stats: Stats; timetableToday: TimeSlot[];
    currentLesson: TimeSlot | null;
    upcomingExams: Exam[]; upcomingHomework: HW[];
    recentAnnouncements: Announcement[];
}

const teacherTypeBadge: Record<string, string> = {
    'Form Master': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'Subject Teacher': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'Both': 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
};

const QUICK_ACTIONS = [
    { label: 'Take Attendance', href: '/school/teacher/attendance', icon: ClipboardCheck, color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
    { label: 'Enter Marks', href: '/school/teacher/marks', icon: PenTool, color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
    { label: 'Create Homework', href: '/school/teacher/homework/create', icon: ClipboardList, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
    { label: 'View Syllabus', href: '/school/teacher/syllabus', icon: BookOpen, color: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400' },
    { label: 'Lesson Plans', href: '/school/teacher/lesson-plans', icon: BookOpen, color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' },
    { label: 'Messages', href: '/school/teacher/messages', icon: MessageSquare, color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' },
];

export default function TeacherDashboard({
    linked, teacher, academicYear, academicTerm, assignedSubjects, assignedClasses,
    stats, timetableToday, currentLesson, upcomingExams, upcomingHomework, recentAnnouncements,
}: Props) {
    if (!linked || !teacher) {
        return (
            <AppLayout title="Teacher Dashboard">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <GraduationCap className="w-16 h-16 text-slate-300 mb-4" />
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Account not linked</h2>
                    <p className="text-slate-500 mt-2 max-w-sm">Your user account hasn&apos;t been linked to a teacher record yet. Please contact your school administrator.</p>
                </div>
            </AppLayout>
        );
    }

    const typeLabel = teacher.is_form_master && teacher.is_subject_teacher
        ? 'Both'
        : teacher.is_form_master
            ? 'Form Master'
            : 'Subject Teacher';

    const statCards = [
        { label: 'Classes Teaching', value: stats.classes_teaching, icon: BookOpen, color: 'bg-indigo-100 dark:bg-indigo-900/30', iconColor: 'text-indigo-600', href: '/school/teacher/academic' },
        { label: 'Total Students', value: stats.total_students, icon: Users, color: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600', href: '/school/teacher/students' },
        { label: 'Attendance Today', value: stats.attendance_today, icon: ClipboardCheck, color: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600', href: '/school/teacher/attendance' },
        { label: 'Homework Pending', value: stats.homework_pending, icon: ClipboardList, color: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600', href: '/school/teacher/homework' },
        { label: 'Exams Awaiting Marks', value: stats.exams_awaiting_marks, icon: FileText, color: 'bg-rose-100 dark:bg-rose-900/30', iconColor: 'text-rose-600', href: '/school/teacher/exams' },
        { label: 'Unread Messages', value: stats.unread_messages, icon: MessageSquare, color: 'bg-violet-100 dark:bg-violet-900/30', iconColor: 'text-violet-600', href: '/school/teacher/messages' },
    ];

    return (
        <AppLayout title="Teacher Dashboard">
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/school/teacher/dashboard" className="hover:text-slate-700 dark:hover:text-slate-300">Teacher</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Dashboard</span>
                </div>

                <div className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white flex items-center gap-5">
                    <ProfileAvatar
                        src={teacher.photo_url}
                        name={teacher.full_name}
                        size="xl"
                        showRing
                    />
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold">{teacher.full_name}</h1>
                        <p className="text-white/80 text-sm">{teacher.emp_id} · {teacher.designation ?? '—'} · {teacher.department ?? '—'}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge className={cn('text-[10px] border-0', teacherTypeBadge[typeLabel] ?? 'bg-white/20 text-white')}>{typeLabel}</Badge>
                            {academicYear && <Badge variant="secondary" className="text-[10px] bg-white/20 text-white border-0">{academicYear}{academicTerm ? ` · ${academicTerm}` : ''}</Badge>}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {statCards.map(s => (
                        <Link key={s.label} href={s.href}>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', s.color)}>
                                            <s.icon className={cn('w-4 h-4', s.iconColor)} />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {QUICK_ACTIONS.map(a => (
                        <Link key={a.label} href={a.href} className="block">
                            <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow text-center">
                                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', a.color)}>
                                    <a.icon className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{a.label}</span>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3 space-y-6">
                        {currentLesson && (
                            <Card className="ring-2 ring-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-indigo-700 dark:text-indigo-400">
                                        <Clock className="w-4 h-4" /> Current Lesson
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">{currentLesson.subject ?? '—'}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        {currentLesson.class}{currentLesson.section ? ` — ${currentLesson.section}` : ''}
                                        {currentLesson.room ? ` · Room ${currentLesson.room}` : ''}
                                    </p>
                                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">{currentLesson.start_time} – {currentLesson.end_time}</p>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <Calendar className="w-4 h-4 text-indigo-500" /> Today&apos;s Timetable
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {timetableToday.length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-4">No classes scheduled today.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {timetableToday.map((t, i) => {
                                            const isCurrent = currentLesson
                                                && t.subject === currentLesson.subject
                                                && t.start_time === currentLesson.start_time
                                                && t.class === currentLesson.class;
                                            return (
                                                <div key={i} className={cn(
                                                    'flex items-center gap-3 p-2.5 rounded-lg',
                                                    isCurrent
                                                        ? 'bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-400'
                                                        : 'bg-slate-50 dark:bg-slate-800/50'
                                                )}>
                                                    <div className="w-16 text-xs text-slate-500 shrink-0">
                                                        <div>{t.start_time}</div>
                                                        <div>{t.end_time}</div>
                                                    </div>
                                                    <div className={cn('w-1 h-8 rounded-full shrink-0', isCurrent ? 'bg-indigo-500' : 'bg-indigo-300')} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{t.subject ?? '—'}</p>
                                                        <p className="text-xs text-slate-400">{t.class}{t.section ? ` — ${t.section}` : ''}{t.room ? ` · Room ${t.room}` : ''}</p>
                                                    </div>
                                                    {isCurrent && <Badge className="text-[10px] h-4 px-1.5 bg-indigo-600">Now</Badge>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <FileText className="w-4 h-4 text-rose-500" /> Upcoming Exams
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {upcomingExams.length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-4">No upcoming exams.</p>
                                ) : (
                                    <ul className="space-y-2.5">
                                        {upcomingExams.map(e => (
                                            <li key={e.id} className="flex items-start gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{e.name}</p>
                                                    <p className="text-xs text-slate-400">{e.start_date ?? '—'} · {e.type}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <ClipboardList className="w-4 h-4 text-amber-500" /> Upcoming Homework
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {upcomingHomework.length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-4">No pending homework.</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {upcomingHomework.map(h => (
                                            <li key={h.id} className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full shrink-0 bg-amber-500" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{h.title}</p>
                                                </div>
                                                <span className="text-xs text-slate-400 shrink-0">{h.due_date ?? '—'}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <Megaphone className="w-4 h-4 text-violet-500" /> Announcements
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {recentAnnouncements.length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-4">No announcements.</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {recentAnnouncements.map(a => (
                                            <li key={a.id} className={cn(
                                                'rounded-lg px-3 py-2.5',
                                                a.pinned
                                                    ? 'bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40'
                                                    : 'bg-slate-50 dark:bg-slate-800/40'
                                            )}>
                                                {a.pinned && (
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <span className="text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">Pinned</span>
                                                    </div>
                                                )}
                                                <p className={cn('text-sm font-semibold', a.pinned ? 'text-amber-900 dark:text-amber-200' : 'text-slate-800 dark:text-slate-200')}>{a.title}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{a.body}</p>
                                                {a.date && <p className="text-[11px] text-slate-400 mt-1">{a.date}</p>}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
