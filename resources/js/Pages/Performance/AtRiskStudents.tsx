import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, User, Shield, ArrowRight, Siren } from 'lucide-react';

interface Student {
    id: number;
    full_name: string;
    admission_no: string;
    photo: string | null; photo_url: string | null;
    schoolClass?: { name: string };
    section?: { name: string };
}

interface Score {
    student: Student;
    total_score: number;
    classification: string;
    class_rank: number | null;
    school_rank: number | null;
}

interface Props {
    linked: boolean;
    students: Score[];
}

const classificationColors: Record<string, string> = {
    needs_support: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    needs_monitoring: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
};

const classificationLabels: Record<string, string> = {
    needs_support: 'Needs Support',
    critical: 'Critical',
    needs_monitoring: 'Needs Monitoring',
};

function getRecommendation(classification: string, score: number): string {
    if (classification === 'critical' || score < 30) {
        return 'Immediate intervention required — assign a dedicated mentor and schedule parent meeting.';
    }
    if (classification === 'needs_support' || score < 50) {
        return 'Provide additional tutoring and weekly progress monitoring.';
    }
    return 'Monitor closely and offer supplementary study materials.';
}

export default function AtRiskStudents({ linked, students }: Props) {
    if (!linked) {
        return (
            <AppLayout title="At-Risk Students">
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <AlertTriangle className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Account Not Linked</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">Link your account to a school to view at-risk students.</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="At-Risk Students">
            <div className="space-y-6">
                {/* Header */}
                <div className="rounded-xl bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white flex items-center gap-5">
                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/20">
                        <Siren className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Students Requiring Attention</h1>
                        <p className="text-white/80 text-sm mt-1">Early warning indicators for students who may need additional support</p>
                    </div>
                </div>

                {/* Summary */}
                <div className="flex items-center gap-4">
                    <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-sm px-3 py-1">
                        <AlertTriangle className="w-3.5 h-3.5 mr-1" /> {students.length} Student{students.length !== 1 ? 's' : ''} At Risk
                    </Badge>
                </div>

                {/* Student Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {students.map((s) => {
                        const cls = s.classification;
                        const isCritical = cls === 'critical' || s.total_score < 30;
                        const borderColor = isCritical
                            ? 'border-red-300 dark:border-red-800/50'
                            : 'border-orange-300 dark:border-orange-800/50';
                        const bgColor = isCritical
                            ? 'bg-red-50/50 dark:bg-red-900/10'
                            : 'bg-orange-50/50 dark:bg-orange-900/10';

                        return (
                            <Card key={s.student.id} className={`${borderColor} ${bgColor}`}>
                                <CardContent className="p-5 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                                            {s.student.photo_url
                                                ? <img src={s.student.photo_url} alt={s.student.full_name} className="w-full h-full object-cover" />
                                                : <User className="w-5 h-5 text-slate-500 dark:text-slate-400" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{s.student.full_name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {s.student.schoolClass?.name}{s.student.section?.name ? ` — ${s.student.section.name}` : ''}
                                            </p>
                                        </div>
                                        <Badge className={`text-[10px] ${classificationColors[cls] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                            {classificationLabels[cls] || cls}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{Number(s.total_score).toFixed(1)}%</p>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400">Overall Score</p>
                                        </div>
                                        {isCritical && (
                                            <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                                                <Siren className="w-4 h-4" />
                                                <span className="text-xs font-semibold">Critical</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-3 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                                        <div className="flex items-start gap-2">
                                            <Shield className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                                {getRecommendation(cls, s.total_score)}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {students.length === 0 && (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto mb-3">
                                <ArrowRight className="w-7 h-7 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">All Clear</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">No students are currently flagged as at-risk.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
