import MinistryLayout from '@/Layouts/MinistryLayout';
import { useRealtime } from '@/lib/useRealtime';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, MapPin, GraduationCap, Activity } from 'lucide-react';

interface DistrictRow {
    id: number;
    name: string;
    national_students_count: number;
}

interface Props {
    byGender: Record<string, number>;
    byLevel: Record<string, number>;
    byDistrict: DistrictRow[];
    enrollmentTrend: Record<string, number>;
    totalStudents: number;
    activeStudents: number;
}

export default function StudentAnalytics({ byGender, byLevel, byDistrict, enrollmentTrend, totalStudents, activeStudents }: Props) {
    const genderEntries = Object.entries(byGender).sort((a, b) => b[1] - a[1]);
    const levelEntries = Object.entries(byLevel).sort((a, b) => b[1] - a[1]);

    const trendEntries = Object.entries(enrollmentTrend)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month));
    const trendMax = Math.max(1, ...trendEntries.map((t) => t.count));

    const activePct = totalStudents > 0 ? ((activeStudents / totalStudents) * 100).toFixed(1) : '0';

    useRealtime();

    return (
        <MinistryLayout title="Enrollment Analytics">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-primary" />
                        Enrollment Analytics
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        National student enrollment breakdown by gender, level and district
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Students</p>
                                    <p className="text-3xl font-bold text-foreground">{totalStudents.toLocaleString()}</p>
                                </div>
                                <Users className="w-8 h-8 text-primary/40" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Active Students</p>
                                    <p className="text-3xl font-bold text-foreground">{activeStudents.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">{activePct}% of national registry</p>
                                </div>
                                <Activity className="w-8 h-8 text-green-500/40" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Districts Reporting</p>
                                    <p className="text-3xl font-bold text-foreground">{byDistrict.length}</p>
                                </div>
                                <MapPin className="w-8 h-8 text-primary/40" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-serif flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-primary" />
                                By Gender
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {genderEntries.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
                            ) : (
                                <div className="space-y-3">
                                    {genderEntries.map(([gender, count]) => {
                                        const pct = totalStudents > 0 ? ((count / totalStudents) * 100).toFixed(1) : '0';
                                        return (
                                            <div key={gender} className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-foreground capitalize">{gender}</span>
                                                    <span className="text-sm text-muted-foreground">{count.toLocaleString()} ({pct}%)</span>
                                                </div>
                                                <div className="w-full bg-muted rounded-full h-3">
                                                    <div className="h-3 rounded-full bg-primary" style={{ width: `${pct}%` }} />
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
                            <CardTitle className="text-lg font-serif flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-primary" />
                                By Current Level
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {levelEntries.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
                            ) : (
                                <div className="space-y-3">
                                    {levelEntries.map(([level, count]) => {
                                        const pct = totalStudents > 0 ? ((count / totalStudents) * 100).toFixed(1) : '0';
                                        return (
                                            <div key={level} className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-foreground capitalize">{level}</span>
                                                    <span className="text-sm text-muted-foreground">{count.toLocaleString()} ({pct}%)</span>
                                                </div>
                                                <div className="w-full bg-muted rounded-full h-3">
                                                    <div className="h-3 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-serif flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Enrollment Trend (Last 12 Months)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {trendEntries.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">No enrollment data available</p>
                        ) : (
                            <div className="flex items-end gap-2 h-48">
                                {trendEntries.map((t) => (
                                    <div key={t.month} className="flex-1 flex flex-col items-center gap-1 group">
                                        <span className="text-xs font-medium text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                            {t.count.toLocaleString()}
                                        </span>
                                        <div
                                            className="w-full bg-primary/70 hover:bg-primary rounded-t-md transition-all"
                                            style={{ height: `${Math.max(4, (t.count / trendMax) * 100)}%` }}
                                        />
                                        <span className="text-[10px] text-muted-foreground rotate-45 origin-top-left whitespace-nowrap">
                                            {t.month}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-serif">Students by District</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">#</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">District</th>
                                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Total Students</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {byDistrict.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="py-12 text-center text-muted-foreground">
                                                <MapPin className="w-10 h-10 mx-auto mb-2 opacity-40" />
                                                <p>No district data available</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        byDistrict.map((d, i) => (
                                            <tr key={d.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                                <td className="py-3 px-4 text-muted-foreground">{i + 1}</td>
                                                <td className="py-3 px-4 font-medium text-foreground">{d.name}</td>
                                                <td className="py-3 px-4 text-right text-foreground">{d.national_students_count.toLocaleString()}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-border bg-accent/50">
                                        <td className="py-3 px-4 font-sans text-sm font-semibold text-foreground" colSpan={2}>
                                            National Total
                                        </td>
                                        <td className="py-3 px-4 text-right font-sans text-sm font-semibold text-foreground">
                                            {byDistrict.reduce((s, d) => s + d.national_students_count, 0).toLocaleString()}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MinistryLayout>
    );
}
