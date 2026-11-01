import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    User, GraduationCap, Target, BookOpen, ClipboardCheck, HandHeart, Shield, Award,
    AlertTriangle, TrendingUp, BarChart3, Star, CheckCircle, Trophy, Lightbulb, Home,
} from 'lucide-react';
import { usePage } from '@inertiajs/react';
import type { PageProps } from '@/Types';

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

export default function ChildPerformanceDetail({ linked, profile }: Props) {
    const { schoolConfig } = usePage<PageProps>().props;
    const posShow = schoolConfig?.result_show_position ?? 'none';

    if (!linked) {
        return (
            <AppLayout title="Child Performance">
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <User className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Account Not Linked</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">Link your account to view your child's detailed performance.</p>
                </div>
            </AppLayout>
        );
    }

    const { student, current_score: score, goals, achievements } = profile;
    const classification = score?.classification || 'needs_monitoring';
    const totalScore = score?.total_score ?? 0;
    const circumference = 2 * Math.PI * 54;
    const strokeDashoffset = circumference - (totalScore / 100) * circumference;

    const breakdownItems = score ? [
        { label: 'Academic', value: score.academic_score, icon: BookOpen },
        { label: 'Attendance', value: score.attendance_score, icon: CheckCircle },
        { label: 'Homework', value: score.homework_score, icon: ClipboardCheck },
        { label: 'Behavior', value: score.behavior_score, icon: Shield },
        { label: 'Participation', value: score.participation_score, icon: HandHeart },
    ] : [];

    const subjectEntries = score?.subject_scores ? Object.values(score.subject_scores) : [];
    const strengths = subjectEntries.filter(s => s.percentage >= 70).sort((a, b) => b.percentage - a.percentage);
    const improvements = subjectEntries.filter(s => s.percentage < 50).sort((a, b) => a.percentage - b.percentage);

    return (
        <AppLayout title="Child Performance">
            <div className="space-y-6">
                <div className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white flex items-center gap-5">
                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/20">
                        <Star className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{student.full_name}'s Performance</h1>
                        <p className="text-white/80 text-sm mt-1">Detailed view of your child's progress and achievements</p>
                    </div>
                </div>

                {profile.pending_alerts > 0 && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{profile.pending_alerts} pending alert{profile.pending_alerts > 1 ? 's' : ''}</p>
                            {profile.active_interventions > 0 && (
                                <p className="text-xs text-amber-600 dark:text-amber-400">{profile.active_interventions} active intervention{profile.active_interventions > 1 ? 's' : ''} in place</p>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center overflow-hidden shrink-0">
                        {student.photo_url
                            ? <img src={student.photo_url} alt="" className="w-14 h-14 rounded-full object-cover" />
                            : <User className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                        }
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{student.full_name}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {student.schoolClass?.name}{student.section?.name ? ` — ${student.section.name}` : ''} · Adm# {student.admission_no}
                        </p>
                    </div>
                    {score && (
                        <Badge className={`text-[11px] ${classificationColors[classification] || ''}`}>
                            {classificationLabels[classification] || classification}
                        </Badge>
                    )}
                </div>

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
                                        className={`${gaugeColors[classification] || 'text-purple-500'} transition-all duration-700`}
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
                                {(posShow === 'class' || posShow === 'subject') && score?.class_rank && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 dark:text-slate-400">Class Rank</span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">#{score.class_rank}</span>
                                    </div>
                                )}
                                {(posShow === 'overall' || posShow === 'subject') && score?.school_rank && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 dark:text-slate-400">School Rank</span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">#{score.school_rank}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="lg:col-span-2 space-y-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <BarChart3 className="w-4 h-4 text-purple-500" /> Score Breakdown
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

                {subjectEntries.length > 0 && (
                    <>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <BookOpen className="w-4 h-4 text-blue-500" /> Subject Performance
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
                                                        <span className="font-semibold text-purple-600 dark:text-purple-400">{Number(sub.percentage).toFixed(1)}%</span>
                                                    </td>
                                                    <td className="py-2 text-center">
                                                        {sub.grade
                                                            ? <Badge className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">{sub.grade}</Badge>
                                                            : <span className="text-slate-400">—</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {strengths.length > 0 && (
                                <Card className="border-green-200 dark:border-green-900">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-400">
                                            <Trophy className="w-4 h-4" /> Strengths
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {strengths.map((s, i) => (
                                                <li key={i} className="flex items-center justify-between">
                                                    <span className="text-sm text-slate-700 dark:text-slate-300">{s.subject_name}</span>
                                                    <Badge className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">{Number(s.percentage).toFixed(1)}%</Badge>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}

                            {improvements.length > 0 && (
                                <Card className="border-orange-200 dark:border-orange-900">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-orange-700 dark:text-orange-400">
                                            <TrendingUp className="w-4 h-4" /> Areas for Improvement
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {improvements.map((s, i) => (
                                                <li key={i} className="flex items-center justify-between">
                                                    <span className="text-sm text-slate-700 dark:text-slate-300">{s.subject_name}</span>
                                                    <Badge className="text-[10px] bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">{Number(s.percentage).toFixed(1)}%</Badge>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(posShow === 'class' || posShow === 'subject') && (
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30">
                                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">{score?.class_rank ? `#${score.class_rank}` : '—'}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Class Rank</p>
                            </div>
                        </CardContent>
                    </Card>
                    )}
                    {(posShow === 'overall' || posShow === 'subject') && (
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                                <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">{score?.school_rank ? `#${score.school_rank}` : '—'}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">School Rank</p>
                            </div>
                        </CardContent>
                    </Card>
                    )}
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30">
                                <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">{achievements.length}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Achievements Earned</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <Home className="w-4 h-4 text-indigo-500" /> Recommended Home Support
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {improvements.length > 0 && (
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                                    <Lightbulb className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Extra practice needed</p>
                                        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                                            {student.full_name} could benefit from extra support in {improvements.map(s => s.subject_name).join(', ')}.
                                            Consider setting aside dedicated practice time each evening.
                                        </p>
                                    </div>
                                </div>
                            )}
                            {score && score.attendance_score < 70 && (
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                                    <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Attendance focus</p>
                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                            Regular attendance is key to success. Let's work together to ensure {student.full_name} attends school every day.
                                        </p>
                                    </div>
                                </div>
                            )}
                            {score && score.homework_score < 60 && (
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                    <Lightbulb className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Homework routine</p>
                                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                            Creating a consistent homework routine at home can help improve results. A quiet study space and regular schedule make a big difference.
                                        </p>
                                    </div>
                                </div>
                            )}
                            {improvements.length === 0 && score && score.attendance_score >= 70 && score.homework_score >= 60 && (
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-green-800 dark:text-green-300">Keep up the great work!</p>
                                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                            {student.full_name} is doing wonderfully across all areas. Continue to encourage reading, curiosity, and a positive attitude toward learning.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {goals.length > 0 && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <Target className="w-4 h-4 text-violet-500" /> Goals
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {goals.map((goal: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{goal.title || goal.description || `Goal #${i + 1}`}</p>
                                            {goal.target_date && <p className="text-xs text-slate-500 dark:text-slate-400">Due: {goal.target_date}</p>}
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
                                <Award className="w-4 h-4 text-yellow-500" /> Achievements
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
            </div>
        </AppLayout>
    );
}
