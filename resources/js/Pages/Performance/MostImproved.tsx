import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, User, ArrowUpRight, Sparkles } from 'lucide-react';

interface Student {
    id: number;
    full_name: string;
    admission_no: string;
    photo: string | null; photo_url: string | null;
    schoolClass?: { name: string };
    section?: { name: string };
}

interface ImprovedStudent {
    student: Student;
    total_score: number;
    classification: string;
    improvement: number;
    previous_score: number;
}

interface Props {
    linked: boolean;
    students: ImprovedStudent[];
}

const classificationColors: Record<string, string> = {
    excellent: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    good: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    needs_monitoring: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    needs_support: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const classificationLabels: Record<string, string> = {
    excellent: 'Excellent',
    good: 'Good',
    needs_monitoring: 'Needs Monitoring',
    needs_support: 'Needs Support',
    critical: 'Critical',
};

export default function MostImproved({ linked, students }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Most Improved Students">
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <TrendingUp className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Account Not Linked</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">Link your account to a school to view improvement data.</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Most Improved Students">
            <div className="space-y-6">
                {/* Header */}
                <div className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white flex items-center gap-5">
                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/20">
                        <TrendingUp className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Most Improved Students</h1>
                        <p className="text-white/80 text-sm mt-1">Recognizing students who have shown the greatest progress</p>
                    </div>
                </div>

                {/* Summary */}
                <div className="flex items-center gap-4">
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-sm px-3 py-1">
                        <Sparkles className="w-3.5 h-3.5 mr-1" /> {students.length} Student{students.length !== 1 ? 's' : ''} Improved
                    </Badge>
                </div>

                {/* Student List */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <ArrowUpRight className="w-4 h-4 text-emerald-500" /> Improvement Rankings
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {students.map((s, i) => (
                                <div key={s.student.id} className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                                    i === 0 ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200/50 dark:border-emerald-800/30'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                }`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                                            {i === 0
                                                ? <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                                : <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">#{i + 1}</span>}
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                                            {s.student.photo_url
                                                ? <img src={s.student.photo_url} alt={s.student.full_name} className="w-full h-full object-cover" />
                                                : <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{s.student.full_name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {s.student.schoolClass?.name}{s.student.section?.name ? ` — ${s.student.section.name}` : ''}
                                                {s.previous_score != null ? ` · Was ${Number(s.previous_score).toFixed(1)}%` : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge className={`text-[10px] ${classificationColors[s.classification] || ''}`}>
                                            {classificationLabels[s.classification] || s.classification}
                                        </Badge>
                                        <div className="text-right min-w-[70px]">
                                            <div className="flex items-center gap-1 justify-end">
                                                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                                                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                                    +{Number(s.improvement).toFixed(1)}%
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                                Now: {Number(s.total_score).toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {students.length === 0 && (
                                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">No improvement data available yet.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
