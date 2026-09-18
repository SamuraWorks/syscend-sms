import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Award, TrendingUp, User, AlertTriangle, CheckCircle } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import type { PageProps } from '@/Types';
import ParentChildSwitcher from '@/components/ParentChildSwitcher';

interface ReportCard {
    id: number; student: string | null; class: string | null;
    academic_year: string | null; term: string | null;
    percentage: number | null; grade: string | null; rank: number | null;
    status: string; promotion_status: string | null;
    attendance: { total: number | null; present: number | null; };
}
interface Props {
    linked: boolean; guardian: { name: string } | null; reportCards: ReportCard[];
    childrenIndex?: { id: number; full_name: string }[]; selectedChild?: string | null;
}

import { gradeColor } from '@/lib/gradeColor';

function statusBadge(status: string) {
    const s = status.toLowerCase();
    if (s === 'published') return <Badge className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Published</Badge>;
    if (s === 'draft') return <Badge className="text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">Draft</Badge>;
    return <Badge className="text-[10px]">{status}</Badge>;
}

function ordinal(n: number): string {
    const s = ['th','st','nd','rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function ParentReportCards({ linked, reportCards, childrenIndex, selectedChild }: Props) {
    const { schoolConfig } = usePage<PageProps>().props;

    if (!linked) {
        return (
            <AppLayout title="Children Report Cards">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <FileText className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const grouped: Record<string, ReportCard[]> = {};
    for (const rc of reportCards) {
        const key = rc.student ?? 'Unknown';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(rc);
    }

    return (
        <AppLayout title="Children Report Cards">
            <div className="space-y-8">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Children Report Cards</h1>
                    <ParentChildSwitcher childrenIndex={childrenIndex} selectedChild={selectedChild} />
                </div>

                {reportCards.length === 0 ? (
                    <Card><CardContent className="py-16 text-center text-slate-400">No report cards available yet.</CardContent></Card>
                ) : (
                    Object.entries(grouped).map(([studentName, cards]) => (
                        <div key={studentName}>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">{studentName}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {cards.map(rc => (
                                    <Card key={rc.id}>
                                        <CardContent className="p-5 space-y-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-semibold text-slate-900 dark:text-white">{rc.class ?? '—'}</p>
                                                    <p className="text-xs text-slate-500">{rc.academic_year ?? '—'} · {rc.term ?? '—'}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {schoolConfig?.result_show_position !== 'none' && rc.rank !== null && (
                                                        <Badge className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                                            {schoolConfig?.result_position_type === 'dense' ? ordinal(rc.rank) : `#${rc.rank}`}
                                                        </Badge>
                                                    )}
                                                    {statusBadge(rc.status)}
                                                </div>
                                            </div>

                                            {rc.percentage !== null && (
                                                <div>
                                                    <div className="flex items-center justify-between text-xs mb-1">
                                                        <span className="text-slate-500">Overall Score</span>
                                                        <span className={cn('font-semibold', rc.percentage >= 70 ? 'text-green-600' : rc.percentage >= 50 ? 'text-amber-600' : 'text-red-600')}>
                                                            {rc.percentage}%
                                                        </span>
                                                    </div>
                                                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <div className={cn('h-full rounded-full transition-all', rc.percentage >= 70 ? 'bg-green-500' : rc.percentage >= 50 ? 'bg-amber-500' : 'bg-red-500')}
                                                            style={{ width: `${rc.percentage}%` }} />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-4 text-xs">
                                                {rc.grade && (
                                                    <div className="flex items-center gap-1">
                                                        <Award className="w-3.5 h-3.5 text-slate-400" />
                                                        <span className={cn('font-bold', gradeColor(rc.grade))}>{rc.grade}</span>
                                                    </div>
                                                )}
                                                {schoolConfig?.result_show_position !== 'none' && rc.rank !== null && (
                                                    <div className="flex items-center gap-1">
                                                        <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                                                        <span className="text-slate-600 dark:text-slate-400">Rank: {schoolConfig?.result_position_type === 'dense' ? ordinal(rc.rank) : `#${rc.rank}`}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                                                <p className="text-xs text-slate-500 mb-1">Attendance</p>
                                                <div className="flex items-center gap-3 text-xs">
                                                    <span className="text-green-600">{rc.attendance.present ?? 0} present</span>
                                                    <span className="text-slate-400">/ {rc.attendance.total ?? 0} total</span>
                                                </div>
                                            </div>

                                            {rc.promotion_status && (
                                                <div className="flex items-center gap-2 text-xs">
                                                    {rc.promotion_status === 'promoted' ? (
                                                        <><CheckCircle className="w-3.5 h-3.5 text-green-500" /><span className="text-green-600 font-medium">Promoted</span></>
                                                    ) : rc.promotion_status === 'probation' ? (
                                                        <><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /><span className="text-amber-600 font-medium">Probation</span></>
                                                    ) : (
                                                        <><AlertTriangle className="w-3.5 h-3.5 text-red-500" /><span className="text-red-600 font-medium">{rc.promotion_status}</span></>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </AppLayout>
    );
}
