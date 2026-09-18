import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Crown, User, Filter, BarChart3 } from 'lucide-react';

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
    groupBy: string;
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

function RankIcon({ rank }: { rank: number }) {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">{rank}</span>;
}

export default function TopStudents({ linked, students, groupBy }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Top Students">
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Trophy className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Account Not Linked</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">Link your account to a school to view top performing students.</p>
                </div>
            </AppLayout>
        );
    }

    const filterOptions = ['School', 'Class', 'Department'];

    return (
        <AppLayout title="Top Performing Students">
            <div className="space-y-6">
                {/* Header */}
                <div className="rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 p-6 text-white flex items-center gap-5">
                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/20">
                        <Trophy className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Top Performing Students</h1>
                        <p className="text-white/80 text-sm mt-1">Students with the highest performance scores</p>
                    </div>
                </div>

                {/* Filter Options */}
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">Group by:</span>
                    {filterOptions.map((opt) => (
                        <Badge
                            key={opt}
                            variant={groupBy?.toLowerCase() === opt.toLowerCase() ? 'default' : 'secondary'}
                            className={`text-[11px] cursor-pointer ${
                                groupBy?.toLowerCase() === opt.toLowerCase()
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            {opt}
                        </Badge>
                    ))}
                </div>

                {/* Ranked List */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <BarChart3 className="w-4 h-4 text-yellow-500" /> Ranked Students ({students.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {students.map((s, i) => {
                                const rank = i + 1;
                                return (
                                    <div key={s.student.id} className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                                        rank <= 3 ? 'bg-yellow-50/50 dark:bg-yellow-900/10 border border-yellow-200/50 dark:border-yellow-800/30'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                    }`}>
                                        <div className="flex items-center gap-3">
                                            <RankIcon rank={rank} />
                                            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                                                {s.student.photo_url
                                                    ? <img src={s.student.photo_url} alt={s.student.full_name} className="w-full h-full object-cover" />
                                                    : <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{s.student.full_name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {s.student.schoolClass?.name}{s.student.section?.name ? ` — ${s.student.section.name}` : ''}
                                                    {s.school_rank ? ` · School Rank #${s.school_rank}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-3">
                                            <Badge className={`text-[10px] ${classificationColors[s.classification] || ''}`}>
                                                {classificationLabels[s.classification] || s.classification}
                                            </Badge>
                                            <span className="text-sm font-bold text-slate-900 dark:text-white w-14 text-right">
                                                {Number(s.total_score).toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            {students.length === 0 && (
                                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">No performance data available.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
