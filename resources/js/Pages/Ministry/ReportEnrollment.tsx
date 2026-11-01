import MinistryLayout from '@/Layouts/MinistryLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, GraduationCap, Calendar } from 'lucide-react';

interface DistrictEnrollment {
    id: number;
    name: string;
    national_students_count: number;
}

interface Props {
    byLevel: Record<string, number>;
    byDistrict: DistrictEnrollment[];
    trend: Record<string, number>;
}

const LEVEL_LABELS: Record<string, string> = {
    nursery: 'ECE / Nursery',
    primary: 'Primary',
    jss: 'Junior Secondary',
    sss: 'Senior Secondary',
};

const LEVEL_COLORS: Record<string, string> = {
    nursery: 'text-pink-600 bg-pink-50',
    primary: 'text-blue-600 bg-blue-50',
    jss: 'text-amber-600 bg-amber-50',
    sss: 'text-emerald-600 bg-emerald-50',
};

export default function ReportEnrollment({ byLevel, byDistrict, trend }: Props) {
    const totalStudents = Object.values(byLevel).reduce((s, v) => s + v, 0);
    const sortedLevels = Object.entries(byLevel).sort((a, b) => b[1] - a[1]);
    const sortedTrend = Object.entries(trend).sort((a, b) => b[0].localeCompare(a[0]));

    return (
        <MinistryLayout title="Reports — Enrollment Analytics">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-primary" />
                        Enrollment Analytics
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Student enrollment breakdown by education level and district
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card className="lg:col-span-1">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-muted text-primary">
                                    <GraduationCap className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">{totalStudents.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">Total Enrolled</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    {sortedLevels.map(([key, count]) => {
                        const pct = totalStudents > 0 ? ((count / totalStudents) * 100).toFixed(1) : '0';
                        return (
                            <Card key={key}>
                                <CardContent className="p-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-foreground">{LEVEL_LABELS[key] ?? key}</span>
                                            <Badge variant="outline" className={`text-xs ${LEVEL_COLORS[key] ?? ''}`}>{pct}%</Badge>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2">
                                            <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                                        </div>
                                        <p className="text-xs text-muted-foreground">{count.toLocaleString()} students</p>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-serif">Enrollment by District</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">#</th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">District</th>
                                            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Students</th>
                                            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Share</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {byDistrict.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="py-8 text-center text-muted-foreground">No data</td>
                                            </tr>
                                        ) : (
                                            byDistrict.map((d, i) => {
                                                const pct = totalStudents > 0 ? ((d.national_students_count / totalStudents) * 100).toFixed(1) : '0';
                                                return (
                                                    <tr key={d.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                                        <td className="py-3 px-4 text-muted-foreground">{i + 1}</td>
                                                        <td className="py-3 px-4 font-medium text-foreground">{d.name}</td>
                                                        <td className="py-3 px-4 text-right text-foreground">{d.national_students_count.toLocaleString()}</td>
                                                        <td className="py-3 px-4 text-right text-muted-foreground">{pct}%</td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-serif flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-primary" />
                                Enrollment Trend
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {sortedTrend.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">No trend data available</p>
                            ) : (
                                <div className="space-y-2">
                                    {sortedTrend.map(([month, count]) => (
                                        <div key={month} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                                            <span className="text-sm font-medium text-foreground">{month}</span>
                                            <span className="text-sm text-muted-foreground">{count.toLocaleString()} students</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MinistryLayout>
    );
}
