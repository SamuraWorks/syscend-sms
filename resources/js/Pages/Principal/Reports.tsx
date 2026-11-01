import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, ChevronRight, TrendingUp, Users, BookOpen, Calendar, DollarSign } from 'lucide-react';

interface ReportItem { label: string; value: string | number; }
interface Props {
    linked: boolean;
    academicReport: ReportItem[];
    attendanceReport: ReportItem[];
    financialReport: ReportItem[];
    staffReport: ReportItem[];
}

const sectionConfig: Record<string, { title: string; icon: any; color: string }> = {
    academic: { title: 'Academic Overview', icon: BookOpen, color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' },
    attendance: { title: 'Attendance Report', icon: Calendar, color: 'bg-green-100 dark:bg-green-900/30 text-green-600' },
    financial: { title: 'Financial Summary', icon: DollarSign, color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' },
    staff: { title: 'Staff Overview', icon: Users, color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600' },
};

export default function Reports({ linked, academicReport, attendanceReport, financialReport, staffReport }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Reports">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <BarChart3 className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const sections = [
        { key: 'academic', data: academicReport },
        { key: 'attendance', data: attendanceReport },
        { key: 'financial', data: financialReport },
        { key: 'staff', data: staffReport },
    ];

    return (
        <AppLayout title="Reports">
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/school/principal/dashboard" className="hover:text-slate-700 dark:hover:text-slate-300">Principal</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Reports</span>
                </div>

                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-cyan-500" /> Reports
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">School performance reports and analytics</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sections.map(({ key, data }) => {
                        const cfg = sectionConfig[key];
                        const Icon = cfg.icon;
                        return (
                            <Card key={key}>
                                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                                    <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Icon className="w-4 h-4" /> {cfg.title}
                                    </h2>
                                </div>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <tbody>
                                            {data.map((item, i) => (
                                                <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                                                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">{item.label}</td>
                                                    <td className="py-3 px-4 text-right text-slate-900 dark:text-white font-semibold">{item.value}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </AppLayout>
    );
}
