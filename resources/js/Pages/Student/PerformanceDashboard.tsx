import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    User, GraduationCap, Target, BookOpen, ClipboardCheck, HandHeart, Shield, Award,
    AlertTriangle, TrendingUp, BarChart3, Star, CheckCircle, Trophy, Zap, Sparkles,
} from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { PageProps } from '@/Types';

interface Props {
    linked: boolean;
    profile: {
        student: {
            id: number;
            full_name: string;
            admission_no: string;
            class_id: number;
            photo: string | null; photo_url: string | null;
            schoolClass?: { name: string };
            section?: { name: string };
        };
        current_score: {
            total_score: number;
            classification: string;
            academic_score: number;
            attendance_score: number;
            homework_score: number;
            behavior_score: number;
            participation_score: number;
            class_rank: number | null;
            school_rank: number | null;
            total_students_in_class: number | null;
            subject_scores: Record<string, {
                subject_name: string;
                percentage: number;
                average_obtained: number;
                full_marks: number;
                grade: string | null;
            }> | null;
            metadata: Record<string, any>;
        } | null;
        history: any[];
        goals: any[];
        achievements: any[];
        pending_alerts: number;
        active_interventions: number;
    };
}

const classificationColors: Record<string, string> = {
    excellent: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    good: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    needs_monitoring: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    needs_support: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const classificationLabels: Record<string, string> = {
    excellent: 'Excellent', good: 'Good', needs_monitoring: 'Needs Monitoring',
    needs_support: 'Needs Support', critical: 'Critical',
};

const gaugeColors: Record<string, string> = {
    excellent: 'text-green-500', good: 'text-blue-500', needs_monitoring: 'text-yellow-500',
    needs_support: 'text-orange-500', critical: 'text-red-500',
};

const motivationalMessages: Record<string, string> = {
    excellent: "You're doing amazing! Keep up the outstanding work!",
    good: "Great progress! You're on the right track — keep pushing forward!",
    needs_monitoring: "You're getting there! A little more effort will make a big difference.",
    needs_support: "Don't worry, we're here to help you improve. Let's work on this together!",
    critical: "We believe in you! With focused effort and support, you can turn things around.",
};

function ProgressBar({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
    const color =
        value >= 80 ? 'bg-green-500' :
        value >= 60 ? 'bg-blue-500' :
        value >= 40 ? 'bg-yellow-500' :
        value >= 20 ? 'bg-orange-500' : 'bg-red-500';

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                    <Icon className="w-3.5 h-3.5" /> {label}
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">{Number(value).toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
            </div>
        </div>
    );
}

export default function PerformanceDashboard({ linked, profile }: Props) {
    const { schoolConfig } = usePage<PageProps>().props;

    function ordinal(n: number): string {
        const s = ['th','st','nd','rd'];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }

    const showPos = schoolConfig?.result_show_position ?? 'none';

    if (!linked) {
        return (
            <AppLayout title="My Performance">
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <GraduationCap className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Account Not Linked</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">Link your account to a school to view your performance.</p>
                </div>
            </AppLayout>
        );
    }

    const { student, current_score, history, goals, achievements, pending_alerts, active_interventions } = profile;
    const score = current_score;
    const classification = score?.classification || 'needs_monitoring';
    const totalScore = score?.total_score ?? 0;

    const circumference = 2 * Math.PI * 54;
    const strokeDashoffset = circumference - (totalScore / 100) * circumference;

    const breakdownItems = [
        { label: 'Academic', value: score?.academic_score ?? 0, icon: BookOpen },
        { label: 'Attendance', value: score?.attendance_score ?? 0, icon: CheckCircle },
        { label: 'Homework', value: score?.homework_score ?? 0, icon: ClipboardCheck },
        { label: 'Behavior', value: score?.behavior_score ?? 0, icon: Shield },
        { label: 'Participation', value: score?.participation_score ?? 0, icon: HandHeart },
    ];

    const subjectEntries = score?.subject_scores ? Object.values(score.subject_scores) : [];
    const strengths = subjectEntries.filter((s) => s.percentage >= 70);
    const improvements = subjectEntries.filter((s) => s.percentage < 50);

    return (
        <AppLayout title="My Performance">
            <div className="space-y-6">
                <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white flex items-center gap-5">
                    <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center overflow-hidden shrink-0">
                        {student.photo_url
                            ? <img src={student.photo_url} alt={student.full_name} className="w-full h-full object-cover" />
                            : <User className="w-10 h-10 text-white/80" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold">My Performance</h1>
                        <p className="text-white/80 text-sm mt-1">
                            Hi {student.full_name}! Here's how you're doing.
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-[10px] bg-white/20 text-white border-0">
                                {student.schoolClass?.name}{student.section?.name ? ` — ${student.section.name}` : ''}
                            </Badge>
                            {score && (
                                <Badge className={`text-[10px] border-0 ${classificationColors[classification] || ''}`}>
                                    {classificationLabels[classification] || classification}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                {score && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border border-emerald-200 dark:border-emerald-800/40">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                                {motivationalMessages[classification] || "Keep up the great work!"}
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-1">
                        <CardContent className="p-6 flex flex-col items-center">
                            <div className="relative w-32 h-32">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                                    <circle cx="60" cy="60" r="54" fill="none" strokeWidth="8"
                                        className="stroke-slate-200 dark:stroke-slate-700" />
                                    <circle cx="60" cy="60" r="54" fill="none" strokeWidth="8"
                                        strokeLinecap="round"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        className={`${gaugeColors[classification] || 'text-emerald-500'} transition-all duration-700`}
                                        style={{ stroke: 'currentColor' }} />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-bold text-slate-900 dark:text-white">{Number(totalScore).toFixed(1)}</span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">/ 100</span>
                                </div>
                            </div>
                            <Badge className={`mt-3 text-[11px] ${classificationColors[classification] || ''}`}>
                                {classificationLabels[classification] || classification}
                            </Badge>
                            <div className="mt-4 w-full space-y-2">
                                {showPos !== 'none' && showPos !== 'overall' && score?.class_rank && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 dark:text-slate-400">Class Rank</span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                                            {showPos === 'class' && schoolConfig?.result_position_type === 'position'
                                                ? `${ordinal(score.class_rank)} of ${score.total_students_in_class ?? '—'}`
                                                : `#${score.class_rank} of ${score.total_students_in_class ?? '—'}`}
                                        </span>
                                    </div>
                                )}
                                {showPos !== 'none' && showPos !== 'class' && score?.school_rank && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 dark:text-slate-400">School Rank</span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                                            {schoolConfig?.result_position_type === 'position'
                                                ? ordinal(score.school_rank)
                                                : `#${score.school_rank}`}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="lg:col-span-2 space-y-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <BarChart3 className="w-4 h-4 text-emerald-500" /> Score Breakdown
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {breakdownItems.map((item) => (
                                    <ProgressBar key={item.label} label={item.label} value={item.value} icon={item.icon} />
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        ...(showPos !== 'none' && showPos !== 'overall' ? [
                            { label: 'Class Rank', value: score?.class_rank ? `#${score.class_rank}` : '—', icon: TrendingUp, color: 'bg-indigo-100 dark:bg-indigo-900/30', iconColor: 'text-indigo-600' },
                        ] : []),
                        ...(showPos !== 'none' && showPos !== 'class' ? [
                            { label: 'School Rank', value: score?.school_rank ? `#${score.school_rank}` : '—', icon: Trophy, color: 'bg-yellow-100 dark:bg-yellow-900/30', iconColor: 'text-yellow-600' },
                        ] : []),
                        { label: 'Alerts', value: pending_alerts, icon: AlertTriangle, color: 'bg-orange-100 dark:bg-orange-900/30', iconColor: 'text-orange-600' },
                        { label: 'Achievements', value: achievements.length, icon: Award, color: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600' },
                    ].map((item) => (
                        <Card key={item.label}>
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${item.color}`}>
                                    <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">{item.value}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {subjectEntries.length > 0 && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <BookOpen className="w-4 h-4 text-blue-500" /> Subject Scores
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-xs uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                            <th className="text-left py-2 font-medium">Subject</th>
                                            <th className="text-center py-2 font-medium">Obtained</th>
                                            <th className="text-center py-2 font-medium">Full Marks</th>
                                            <th className="text-center py-2 font-medium">Percentage</th>
                                            <th className="text-center py-2 font-medium">Grade</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {subjectEntries.map((sub, i) => (
                                            <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50">
                                                <td className="py-2 text-slate-700 dark:text-slate-300 font-medium">{sub.subject_name}</td>
                                                <td className="py-2 text-center text-slate-600 dark:text-slate-400">{Number(sub.average_obtained).toFixed(1)}</td>
                                                <td className="py-2 text-center text-slate-500">{sub.full_marks}</td>
                                                <td className="py-2 text-center">
                                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{Number(sub.percentage).toFixed(1)}%</span>
                                                </td>
                                                <td className="py-2 text-center">
                                                    {sub.grade
                                                        ? <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">{sub.grade}</Badge>
                                                        : <span className="text-slate-400">—</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {strengths.length > 0 && (
                    <Card className="border-green-200 dark:border-green-800/40">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-400">
                                <Zap className="w-4 h-4" /> My Strengths
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {strengths.map((sub, i) => (
                                    <Badge key={i} className="flex items-center gap-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                        <Star className="w-3 h-3" /> {sub.subject_name} ({Number(sub.percentage).toFixed(0)}%)
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {improvements.length > 0 && (
                    <Card className="border-orange-200 dark:border-orange-800/40">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-orange-700 dark:text-orange-400">
                                <Target className="w-4 h-4" /> Areas for Improvement
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {improvements.map((sub, i) => (
                                    <Badge key={i} className="flex items-center gap-1 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                                        {sub.subject_name} ({Number(sub.percentage).toFixed(0)}%)
                                    </Badge>
                                ))}
                            </div>
                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">Keep working on these — every bit of effort counts!</p>
                        </CardContent>
                    </Card>
                )}

                {goals.length > 0 && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <Target className="w-4 h-4 text-violet-500" /> My Goals
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {goals.map((goal: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{goal.title || goal.description || `Goal #${i + 1}`}</p>
                                            {goal.due_date && <p className="text-xs text-slate-500 dark:text-slate-400">Due: {goal.due_date}</p>}
                                        </div>
                                        <Badge className={`text-[10px] ${
                                            goal.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : goal.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                        }`}>
                                            {goal.status || 'pending'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {achievements.length > 0 && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <Award className="w-4 h-4 text-yellow-500" /> My Achievements
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {achievements.map((ach: any, i: number) => (
                                    <Badge key={i} variant="secondary" className="flex items-center gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                        <Star className="w-3 h-3" /> {ach.title || ach.name || `Achievement #${i + 1}`}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {history.length > 0 && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <TrendingUp className="w-4 h-4 text-green-500" /> My Progress Over Time
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-xs uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                            <th className="text-left py-2 font-medium">Period</th>
                                            <th className="text-center py-2 font-medium">Score</th>
                                            <th className="text-center py-2 font-medium">Classification</th>
                                            {showPos !== 'none' && showPos !== 'overall' && <th className="text-center py-2 font-medium">Class Rank</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map((h: any, i: number) => (
                                            <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50">
                                                <td className="py-2 text-slate-700 dark:text-slate-300 font-medium">{h.period || h.term || `Term ${i + 1}`}</td>
                                                <td className="py-2 text-center font-semibold text-slate-900 dark:text-white">{h.total_score ?? h.percentage ?? '—'}%</td>
                                                <td className="py-2 text-center">
                                                    <Badge className={`text-[10px] ${classificationColors[h.classification] || ''}`}>
                                                        {classificationLabels[h.classification] || h.classification || '—'}
                                                    </Badge>
                                                </td>
                                                {showPos !== 'none' && showPos !== 'overall' && <td className="py-2 text-center text-slate-600 dark:text-slate-400">{h.class_rank ? `#${h.class_rank}` : '—'}</td>}
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
