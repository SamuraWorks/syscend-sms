import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCog, CalendarCheck, DollarSign, Clock, AlertCircle, Trophy, AlertTriangle, ArrowRight, Brain } from 'lucide-react';
import { Link } from '@inertiajs/react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, Legend,
} from 'recharts';

interface Activity { id: number; description: string; causer?: { name: string }; created_at: string; }
interface TopStudent { id: number; name: string; total_score: number; classification: string; class_rank: number | null; schoolClass: string; }
interface AtRiskStudent { id: number; name: string; total_score: number; classification: string; color: string; schoolClass: string; reason: string; }
interface Props {
    role:             string;
    totalStudents:    number;
    totalStaff:       number;
    attendancePct:    number;
    monthFees:        number;
    pendingFees:      number;
    pendingHomework:  number;
    todayCollection?: number;
    feeChart:         { month: string; amount: number }[];
    attChart:         { day: string; present: number; absent: number }[];
    recentActivity:   Activity[];
    schools?:         number;
    topStudents:      TopStudent[];
    atRiskStudents:   AtRiskStudent[];
}

function KpiCard({ title, value, sub, icon: Icon, color }: { title: string; value: string | number; sub?: string; icon: React.ElementType; color: string }) {
    return (
        <Card>
            <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500">{title}</p>
                        <p className="text-2xl font-bold mt-1">{value}</p>
                        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
                    </div>
                    <div className={`p-3 rounded-xl ${color}`}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function Dashboard({ role, totalStudents, totalStaff, attendancePct, monthFees, pendingFees, pendingHomework, todayCollection, feeChart = [], attChart = [], recentActivity = [], schools, topStudents = [], atRiskStudents = [] }: Props) {
    const fmt = (n: number) => new Intl.NumberFormat().format(n);

    return (
        <AppLayout title="Reports Dashboard">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics Dashboard</h1>
                    <p className="text-sm text-slate-500 mt-0.5">School performance overview</p>
                </div>

                {/* KPI Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {role === 'super-admin' ? (
                        <>
                            <KpiCard title="Total Schools"   value={schools ?? 0}          icon={Users}        color="bg-indigo-500" />
                            <KpiCard title="Total Students"  value={fmt(totalStudents)}     icon={Users}        color="bg-green-500" />
                            <KpiCard title="Total Revenue"   value={`Le ${fmt(monthFees)}`}   icon={DollarSign}   color="bg-blue-500" />
                        </>
                    ) : (
                        <>
                            <KpiCard title="Total Students"  value={fmt(totalStudents)}     icon={Users}        color="bg-indigo-500" />
                            <KpiCard title="Active Staff"    value={fmt(totalStaff)}        icon={UserCog}      color="bg-violet-500" />
                            <KpiCard title="Today Attendance" value={`${attendancePct}%`}   icon={CalendarCheck} color="bg-green-500" />
                            <KpiCard title="This Month Fees" value={`Le ${fmt(monthFees)}`}   icon={DollarSign}   color="bg-blue-500" />
                        </>
                    )}
                    <KpiCard title="Outstanding Fees"  value={`Le ${fmt(pendingFees)}`}      icon={AlertCircle}  color="bg-orange-500" />
                    {role === 'accountant' && todayCollection !== undefined && (
                        <KpiCard title="Today Collection" value={`Le ${fmt(todayCollection)}`} icon={DollarSign} color="bg-teal-500" />
                    )}
                    {(role === 'school-admin' || role === 'principal' || role === 'teacher') && (
                        <KpiCard title="Homework Pending" value={pendingHomework}           icon={Clock}        color="bg-yellow-500" />
                    )}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Fee Collection Chart */}
                    {feeChart.length > 0 && (
                        <Card>
                            <CardHeader><CardTitle>Fee Collection (Last 6 Months)</CardTitle></CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={feeChart}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip formatter={(v) => [`Le ${fmt(Number(v))}`, 'Collected']} />
                                        <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}

                    {/* Attendance Chart */}
                    {attChart.length > 0 && (
                        <Card>
                            <CardHeader><CardTitle>Attendance — Last 7 Days</CardTitle></CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={220}>
                                    <LineChart data={attChart}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="present" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} isAnimationActive={false} />
                                        <Line type="monotone" dataKey="absent"  stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} isAnimationActive={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Performance Intelligence — school-admin, principal */}
                {(role === 'school-admin' || role === 'principal') && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Brain className="w-5 h-5 text-indigo-500" />
                                <h2 className="text-lg font-semibold">Performance Intelligence</h2>
                            </div>
                            <Link href="/school/performance/overview" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                                Full Analytics <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Top Performing Students */}
                            {topStudents.length > 0 ? (
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                                            <Trophy className="w-4 h-4 text-amber-500" />
                                            Top Performing Students
                                        </CardTitle>
                                        <Link href="/school/performance/top-students" className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                                            View All <ArrowRight className="w-3 h-3" />
                                        </Link>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-slate-100 dark:border-slate-800 text-left text-xs text-slate-500 uppercase tracking-wide">
                                                    <th className="px-4 py-2">Student</th>
                                                    <th className="px-4 py-2">Class</th>
                                                    <th className="px-4 py-2 text-right">Average</th>
                                                    <th className="px-4 py-2">Grade</th>
                                                    <th className="px-4 py-2 text-right">Position</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                                {topStudents.map((s, i) => (
                                                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer" onClick={() => window.location.href = `/school/performance/student/${s.id}`}>
                                                        <td className="px-4 py-2.5 font-medium flex items-center gap-2">
                                                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                                                {i + 1}
                                                            </span>
                                                            {s.name}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{s.schoolClass}</td>
                                                        <td className="px-4 py-2.5 text-right font-semibold">{Number(s.total_score).toFixed(1)}%</td>
                                                        <td className="px-4 py-2.5">
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                                {s.classification}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2.5 text-right text-slate-500">{s.class_rank ? `#${s.class_rank}` : '—'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                                        <Trophy className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
                                        <p className="text-sm text-muted-foreground">No top performing data yet</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Run assessments to see top students</p>
                                    </CardContent>
                                </Card>
                            )}

                            {/* At-Risk Students */}
                            {atRiskStudents.length > 0 ? (
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                                            At-Risk Students
                                        </CardTitle>
                                        <Link href="/school/performance/at-risk" className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                                            View All <ArrowRight className="w-3 h-3" />
                                        </Link>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-slate-100 dark:border-slate-800 text-left text-xs text-slate-500 uppercase tracking-wide">
                                                    <th className="px-4 py-2">Student</th>
                                                    <th className="px-4 py-2">Class</th>
                                                    <th className="px-4 py-2 text-right">Score</th>
                                                    <th className="px-4 py-2">Risk Level</th>
                                                    <th className="px-4 py-2">Reason</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                                {atRiskStudents.map((s) => (
                                                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer" onClick={() => window.location.href = `/school/performance/student/${s.id}`}>
                                                        <td className="px-4 py-2.5 font-medium">{s.name}</td>
                                                        <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{s.schoolClass}</td>
                                                        <td className="px-4 py-2.5 text-right font-semibold">{Number(s.total_score).toFixed(1)}%</td>
                                                        <td className="px-4 py-2.5">
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                s.color === 'red' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                                s.color === 'orange' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                                                'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                            }`}>
                                                                {s.classification}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400">{s.reason}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                                        <AlertTriangle className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
                                        <p className="text-sm text-muted-foreground">No at-risk students detected</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Run performance analysis to identify students</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                )}

                {/* Recent Activity */}
                {recentActivity && recentActivity.length > 0 && (
                    <Card>
                        <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
                        <CardContent className="divide-y divide-slate-100 dark:divide-slate-800 p-0">
                            {recentActivity.map((a) => (
                                <div key={a.id} className="flex items-center gap-3 px-4 py-2.5">
                                    <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-xs font-semibold text-indigo-600">
                                        {(a.causer?.name ?? '?')[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-slate-700 dark:text-slate-300">{a.description}</p>
                                        <p className="text-xs text-slate-400">{a.causer?.name} · {new Date(a.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
