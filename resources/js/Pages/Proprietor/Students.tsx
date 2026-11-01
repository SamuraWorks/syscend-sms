import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Users, TrendingUp, UsersRound, BookOpen, GraduationCap, ChevronRight,
} from 'lucide-react';

interface LevelCount { level: string; count: number; }
interface EnrollmentPoint { month: string; count: number; }
interface GenderBreakdown { male: number; female: number; }
interface ClassCount { class_name: string; count: number; }
interface Props {
    linked: boolean;
    studentsByLevel: LevelCount[];
    enrollmentTrend: EnrollmentPoint[];
    genderBreakdown: GenderBreakdown;
    classWiseCounts: ClassCount[];
}

export default function ProprietorStudents({
    linked, studentsByLevel, enrollmentTrend, genderBreakdown, classWiseCounts,
}: Props) {
    if (!linked) {
        return (
            <AppLayout title="Student Overview">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Users className="w-16 h-16 text-slate-300 mb-4" />
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Account not linked</h2>
                    <p className="text-slate-500 mt-2 max-w-sm">Your user account hasn&apos;t been linked yet. Please contact the system administrator.</p>
                </div>
            </AppLayout>
        );
    }

    const totalStudents = genderBreakdown.male + genderBreakdown.female;
    const malePercent = totalStudents > 0 ? Math.round((genderBreakdown.male / totalStudents) * 100) : 0;
    const femalePercent = totalStudents > 0 ? Math.round((genderBreakdown.female / totalStudents) * 100) : 0;
    const maxEnrollment = Math.max(...enrollmentTrend.map(e => e.count), 1);

    const overviewCards = [
        { label: 'Total Students', value: totalStudents, icon: Users, color: 'bg-indigo-100 dark:bg-indigo-900/30', iconColor: 'text-indigo-600' },
        { label: 'Male Students', value: genderBreakdown.male, icon: UsersRound, color: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600' },
        { label: 'Female Students', value: genderBreakdown.female, icon: UsersRound, color: 'bg-pink-100 dark:bg-pink-900/30', iconColor: 'text-pink-600' },
        { label: 'Levels', value: studentsByLevel.length, icon: GraduationCap, color: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600' },
    ];

    return (
        <AppLayout title="Student Overview">
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/school/proprietor/dashboard" className="hover:text-slate-700 dark:hover:text-slate-300">Proprietor</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Students</span>
                </div>

                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-500" /> Student Overview
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">Enrollment, demographics, and distribution</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <TrendingUp className="w-4 h-4 text-emerald-500" /> Enrollment Trend
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {enrollmentTrend.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-4">No enrollment data available.</p>
                            ) : (
                                <div className="flex items-end gap-1.5 h-40">
                                    {enrollmentTrend.map((e, i) => (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                            <span className="text-[10px] text-slate-500 font-medium">{e.count}</span>
                                            <div
                                                className="w-full rounded-t bg-indigo-400 dark:bg-indigo-600 min-h-[4px]"
                                                style={{ height: `${(e.count / maxEnrollment) * 100}%` }}
                                            />
                                            <span className="text-[10px] text-slate-400 truncate w-full text-center">{e.month}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <UsersRound className="w-4 h-4 text-pink-500" /> Gender Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm text-slate-700 dark:text-slate-300">Male</span>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">{genderBreakdown.male}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3">
                                        <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${malePercent}%` }} />
                                    </div>
                                    <span className="text-[10px] text-slate-400">{malePercent}%</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm text-slate-700 dark:text-slate-300">Female</span>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">{genderBreakdown.female}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3">
                                        <div className="bg-pink-500 h-3 rounded-full" style={{ width: `${femalePercent}%` }} />
                                    </div>
                                    <span className="text-[10px] text-slate-400">{femalePercent}%</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <GraduationCap className="w-4 h-4 text-violet-500" /> Enrollment by Level
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {studentsByLevel.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-4">No data available.</p>
                            ) : (
                                <div className="space-y-3">
                                    {studentsByLevel.map((l, i) => {
                                        const maxCount = Math.max(...studentsByLevel.map(x => x.count), 1);
                                        return (
                                            <div key={i}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm text-slate-700 dark:text-slate-300">{l.level}</span>
                                                    <Badge variant="secondary" className="text-xs">{l.count}</Badge>
                                                </div>
                                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                                                    <div className="bg-violet-500 h-2 rounded-full" style={{ width: `${(l.count / maxCount) * 100}%` }} />
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
                                <BookOpen className="w-4 h-4 text-blue-500" /> Class-wise Distribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {classWiseCounts.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-4">No class data available.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-200 dark:border-slate-700">
                                                <th className="text-left py-2 text-xs font-medium text-slate-500">Class</th>
                                                <th className="text-right py-2 text-xs font-medium text-slate-500">Students</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {classWiseCounts.map((c, i) => (
                                                <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                                                    <td className="py-2.5 font-medium text-slate-800 dark:text-slate-200">{c.class_name}</td>
                                                    <td className="py-2.5 text-right">
                                                        <Badge variant="secondary" className="text-xs">{c.count}</Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
