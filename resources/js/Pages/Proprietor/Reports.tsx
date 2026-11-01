import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DollarSign, BookOpen, Users, GraduationCap, TrendingUp, ChevronRight,
} from 'lucide-react';

interface FinancialSummary {
    total_revenue: number; total_expenses: number; net_income: number;
    outstanding_fees: number; collection_rate: number;
}
interface AcademicSummary {
    average_pass_rate: number; total_exams: number; top_class: string | null;
    report_cards_generated: number;
}
interface StaffSummary {
    total_staff: number; active_staff: number; pending_leaves: number;
    average_salary: number;
}
interface StudentSummary {
    total_students: number; male: number; female: number;
    new_admissions: number; retention_rate: number;
}
interface Props {
    linked: boolean;
    financialSummary: FinancialSummary;
    academicSummary: AcademicSummary;
    staffSummary: StaffSummary;
    studentSummary: StudentSummary;
}

export default function ProprietorReports({
    linked, financialSummary, academicSummary, staffSummary, studentSummary,
}: Props) {
    if (!linked) {
        return (
            <AppLayout title="Reports">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <BookOpen className="w-16 h-16 text-slate-300 mb-4" />
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Account not linked</h2>
                    <p className="text-slate-500 mt-2 max-w-sm">Your user account hasn&apos;t been linked yet. Please contact the system administrator.</p>
                </div>
            </AppLayout>
        );
    }

    const reportAreas = [
        {
            title: 'Financial Report', icon: DollarSign, iconColor: 'text-emerald-600',
            color: 'bg-emerald-100 dark:bg-emerald-900/30',
            metrics: [
                { label: 'Total Revenue', value: `Le ${financialSummary.total_revenue.toLocaleString()}` },
                { label: 'Total Expenses', value: `Le ${financialSummary.total_expenses.toLocaleString()}` },
                { label: 'Net Income', value: `Le ${financialSummary.net_income.toLocaleString()}` },
                { label: 'Outstanding Fees', value: `Le ${financialSummary.outstanding_fees.toLocaleString()}` },
                { label: 'Collection Rate', value: `${financialSummary.collection_rate}%` },
            ],
        },
        {
            title: 'Academic Report', icon: BookOpen, iconColor: 'text-indigo-600',
            color: 'bg-indigo-100 dark:bg-indigo-900/30',
            metrics: [
                { label: 'Average Pass Rate', value: `${academicSummary.average_pass_rate}%` },
                { label: 'Total Exams', value: academicSummary.total_exams.toString() },
                { label: 'Top Class', value: academicSummary.top_class || '—' },
                { label: 'Report Cards Generated', value: `${academicSummary.report_cards_generated}` },
            ],
        },
        {
            title: 'Staff Report', icon: Users, iconColor: 'text-violet-600',
            color: 'bg-violet-100 dark:bg-violet-900/30',
            metrics: [
                { label: 'Total Staff', value: staffSummary.total_staff.toString() },
                { label: 'Active Staff', value: staffSummary.active_staff.toString() },
                { label: 'Pending Leaves', value: staffSummary.pending_leaves.toString() },
                { label: 'Average Salary', value: `Le ${staffSummary.average_salary.toLocaleString()}` },
            ],
        },
        {
            title: 'Student Report', icon: GraduationCap, iconColor: 'text-blue-600',
            color: 'bg-blue-100 dark:bg-blue-900/30',
            metrics: [
                { label: 'Total Students', value: studentSummary.total_students.toString() },
                { label: 'Male Students', value: studentSummary.male.toString() },
                { label: 'Female Students', value: studentSummary.female.toString() },
                { label: 'New Admissions', value: studentSummary.new_admissions.toString() },
                { label: 'Retention Rate', value: `${studentSummary.retention_rate}%` },
            ],
        },
    ];

    return (
        <AppLayout title="Reports">
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/school/proprietor/dashboard" className="hover:text-slate-700 dark:hover:text-slate-300">Proprietor</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Reports</span>
                </div>

                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-cyan-500" /> Reports Overview
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">Key metrics across all areas of your school</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {reportAreas.map(area => (
                        <Card key={area.title}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', area.color)}>
                                        <area.icon className={cn('w-4 h-4', area.iconColor)} />
                                    </div>
                                    {area.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {area.metrics.map((m, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <span className="text-sm text-slate-600 dark:text-slate-400">{m.label}</span>
                                            <span className="text-sm font-semibold text-slate-900 dark:text-white">{m.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
