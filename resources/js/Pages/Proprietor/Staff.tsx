import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Users, Briefcase, Wallet, Calendar, UserCheck, UserX, ChevronRight,
} from 'lucide-react';

interface DepartmentCount { department: string; count: number; }
interface RoleCount { role: string; count: number; }
interface PayrollSummary { total: number; average: number; }
interface RetentionData { active: number; inactive: number; }
interface Props {
    linked: boolean;
    staffByDepartment: DepartmentCount[];
    staffByRole: RoleCount[];
    payrollSummary: PayrollSummary;
    pendingLeaves: number;
    retentionData: RetentionData;
}

export default function ProprietorStaff({
    linked, staffByDepartment, staffByRole, payrollSummary, pendingLeaves, retentionData,
}: Props) {
    if (!linked) {
        return (
            <AppLayout title="Staff Overview">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Users className="w-16 h-16 text-slate-300 mb-4" />
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Account not linked</h2>
                    <p className="text-slate-500 mt-2 max-w-sm">Your user account hasn&apos;t been linked yet. Please contact the system administrator.</p>
                </div>
            </AppLayout>
        );
    }

    const totalStaff = retentionData.active + retentionData.inactive;
    const retentionRate = totalStaff > 0 ? Math.round((retentionData.active / totalStaff) * 100) : 0;

    const overviewCards = [
        { label: 'Active Staff', value: retentionData.active, icon: UserCheck, color: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600' },
        { label: 'Inactive Staff', value: retentionData.inactive, icon: UserX, color: 'bg-slate-100 dark:bg-slate-800', iconColor: 'text-slate-600' },
        { label: 'Total Payroll', value: `Le ${payrollSummary.total.toLocaleString()}`, icon: Wallet, color: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600' },
        { label: 'Avg Salary', value: `Le ${payrollSummary.average.toLocaleString()}`, icon: Briefcase, color: 'bg-violet-100 dark:bg-violet-900/30', iconColor: 'text-violet-600' },
        { label: 'Pending Leaves', value: pendingLeaves, icon: Calendar, color: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600' },
        { label: 'Retention Rate', value: `${retentionRate}%`, icon: Users, color: 'bg-indigo-100 dark:bg-indigo-900/30', iconColor: 'text-indigo-600' },
    ];

    return (
        <AppLayout title="Staff Overview">
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/school/proprietor/dashboard" className="hover:text-slate-700 dark:hover:text-slate-300">Proprietor</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Staff</span>
                </div>

                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-violet-500" /> Staff Overview
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">Workforce distribution, payroll, and leaves</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {overviewCards.map(s => (
                        <Card key={s.label}>
                            <CardContent className="p-4">
                                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-2', s.color)}>
                                    <s.icon className={cn('w-4 h-4', s.iconColor)} />
                                </div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <Briefcase className="w-4 h-4 text-indigo-500" /> Staff by Department
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {staffByDepartment.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-4">No department data available.</p>
                            ) : (
                                <div className="space-y-3">
                                    {staffByDepartment.map((d, i) => {
                                        const maxCount = Math.max(...staffByDepartment.map(x => x.count), 1);
                                        return (
                                            <div key={i}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm text-slate-700 dark:text-slate-300">{d.department}</span>
                                                    <Badge variant="secondary" className="text-xs">{d.count}</Badge>
                                                </div>
                                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                                                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${(d.count / maxCount) * 100}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <Users className="w-4 h-4 text-violet-500" /> Staff by Role
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {staffByRole.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-4">No role data available.</p>
                            ) : (
                                <div className="space-y-3">
                                    {staffByRole.map((r, i) => {
                                        const maxCount = Math.max(...staffByRole.map(x => x.count), 1);
                                        return (
                                            <div key={i}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm text-slate-700 dark:text-slate-300">{r.role}</span>
                                                    <Badge variant="secondary" className="text-xs">{r.count}</Badge>
                                                </div>
                                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                                                    <div className="bg-violet-500 h-2 rounded-full" style={{ width: `${(r.count / maxCount) * 100}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <Wallet className="w-4 h-4 text-emerald-500" /> Payroll Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600 dark:text-slate-400">Total Staff on Payroll</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{totalStaff}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600 dark:text-slate-400">Total Monthly Payroll</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">Le {payrollSummary.total.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600 dark:text-slate-400">Average Salary</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">Le {payrollSummary.average.toLocaleString()}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <Calendar className="w-4 h-4 text-amber-500" /> Leave Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600 dark:text-slate-400">Pending Leave Requests</span>
                                <Badge className={cn(
                                    'text-xs',
                                    pendingLeaves > 0
                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                )}>{pendingLeaves}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600 dark:text-slate-400">Active Staff</span>
                                <span className="text-sm font-bold text-emerald-600">{retentionData.active}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600 dark:text-slate-400">Inactive Staff</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{retentionData.inactive}</span>
                            </div>
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600 dark:text-slate-400">Retention Rate</span>
                                    <span className="text-sm font-bold text-indigo-600">{retentionRate}%</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-2">
                                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${retentionRate}%` }} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
