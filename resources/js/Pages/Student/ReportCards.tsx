import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, CheckCircle, XCircle, Clock, Minus, FileText } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { PageProps } from '@/Types';

interface ReportCard {
    id: number; academic_year: string | null; term: string | null;
    percentage: number | null; grade: string | null; gpa: number | null;
    rank: number | null; status: string; promotion_status: string | null;
    attendance: { total: number | null; present: number | null; absent: number | null; late: number | null; };
}
interface Props {
    linked: boolean; student: { full_name: string; class: string | null } | null;
    reportCards: ReportCard[];
}

const statusColor: Record<string, string> = {
    passed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

import { gradeColor } from '@/lib/gradeColor';

function ProgressBar({ pct }: { pct: number }) {
    return (
        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
                className={cn('h-full rounded-full', pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500')}
                style={{ width: `${pct}%` }}
            />
        </div>
    );
}

export default function ReportCards({ linked, student, reportCards }: Props) {
    const { schoolConfig } = usePage<PageProps>().props;

    function ordinal(n: number): string {
        const s = ['th','st','nd','rd'];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }

    if (!linked) {
        return (
            <AppLayout title="My Report Cards">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                        <Award className="w-8 h-8 text-slate-300" />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const grouped = reportCards.reduce<Record<string, ReportCard[]>>((acc, rc) => {
        const year = rc.academic_year ?? 'Unknown Year';
        if (!acc[year]) acc[year] = [];
        acc[year].push(rc);
        return acc;
    }, {});
    const years = Object.keys(grouped);

    return (
        <AppLayout title="My Report Cards">
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                        <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">My Report Cards</h1>
                        <p className="text-sm text-slate-500">{student?.class}</p>
                    </div>
                </div>

                {reportCards.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <FileText className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                            <p className="text-sm text-slate-400">No report cards available yet.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {years.map(year => (
                            <div key={year} className="space-y-3">
                                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">{year}</h2>
                                <div className="space-y-4">
                                    {grouped[year].map(rc => (
                                        <Card key={rc.id}>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="flex items-center justify-between text-sm font-semibold">
                                                    <span>{rc.term ?? '—'}</span>
                                                    <div className="flex items-center gap-2">
                                                        {rc.promotion_status && (
                                                            <Badge variant="secondary" className="text-[10px] capitalize">{rc.promotion_status}</Badge>
                                                        )}
                                                        <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full capitalize', statusColor[rc.status] ?? 'bg-slate-100 text-slate-600')}>{rc.status}</span>
                                                    </div>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div>
                                                        <p className="text-xs text-slate-500 mb-1">Percentage</p>
                                                        <p className="text-lg font-bold text-slate-800 dark:text-white">{rc.percentage != null ? `${rc.percentage}%` : '—'}</p>
                                                        {rc.percentage != null && <ProgressBar pct={rc.percentage} />}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-500 mb-1">Grade</p>
                                                        <p className={cn('text-lg font-bold', gradeColor(rc.grade))}>{rc.grade ?? '—'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-500 mb-1">Rank</p>
                                                        <p className="text-lg font-bold text-slate-800 dark:text-white">
                                                            {schoolConfig?.result_show_position !== 'none' && rc.rank != null
                                                                ? (schoolConfig?.result_position_type === 'position' ? ordinal(rc.rank) : `#${rc.rank}`)
                                                                : '—'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-500 mb-1">GPA</p>
                                                        <p className="text-lg font-bold text-slate-800 dark:text-white">{rc.gpa != null ? Number(rc.gpa).toFixed(2) : '—'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                                                    <p className="text-xs text-slate-500 font-medium">Attendance:</p>
                                                    <span className="flex items-center gap-1 text-xs text-green-600">
                                                        <CheckCircle className="w-3 h-3" /> {rc.attendance.present ?? 0} present
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs text-red-500">
                                                        <XCircle className="w-3 h-3" /> {rc.attendance.absent ?? 0} absent
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs text-amber-600">
                                                        <Clock className="w-3 h-3" /> {rc.attendance.late ?? 0} late
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs text-slate-400">
                                                        <Minus className="w-3 h-3" /> {rc.attendance.total ?? 0} total
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
