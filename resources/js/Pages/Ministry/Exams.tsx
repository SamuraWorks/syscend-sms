import MinistryLayout from '@/Layouts/MinistryLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, BarChart3, Users, TrendingUp, Award } from 'lucide-react';
import { Link } from '@inertiajs/react';

interface Props {
    examType: string;
    stats?: {
        total_registered: number;
        total_sat: number;
        total_passed: number;
        pass_rate: number;
        avg_score: number;
    };
    topSchools?: Array<{ name: string; pass_rate: number; avg_score: number }>;
    subjectAverages?: Array<{ subject: string; avg_score: number; grade: string }>;
}

const EXAM_INFO: Record<string, { title: string; description: string; level: string }> = {
    npse: { title: 'NPSE', description: 'National Primary School Examination', level: 'Primary (Class 6)' },
    bece: { title: 'BECE', description: 'Basic Education Certificate Examination', level: 'Junior Secondary (JSS 3)' },
    wasse: { title: 'WASSCE', description: 'West African Senior School Certificate Examination', level: 'Senior Secondary (SSS 3)' },
};

export default function MinistryExams({ examType, stats, topSchools, subjectAverages }: Props) {
    const info = EXAM_INFO[examType] ?? EXAM_INFO.npse;

    const tabs = [
        { key: 'npse', label: 'NPSE', href: '/ministry/exams/npse' },
        { key: 'bece', label: 'BECE', href: '/ministry/exams/bece' },
        { key: 'wasse', label: 'WASSCE', href: '/ministry/exams/wasse' },
        { key: 'analytics', label: 'Analytics', href: '/ministry/exams/analytics' },
    ];

    return (
        <MinistryLayout title={`National Exams — ${info.title}`}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                        <FileText className="w-6 h-6 text-primary" />
                        {info.description}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Level: {info.level}</p>
                </div>

                {/* Exam Type Tabs */}
                <div className="flex gap-1 border border-border rounded-lg p-1 bg-muted/30 w-fit">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.key}
                            href={tab.href}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                examType === tab.key
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                        >
                            {tab.label}
                        </Link>
                    ))}
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {[
                            { label: 'Registered', value: stats.total_registered.toLocaleString(), icon: Users, color: 'text-primary' },
                            { label: 'Sat Exam', value: stats.total_sat.toLocaleString(), icon: FileText, color: 'text-blue-600' },
                            { label: 'Passed', value: stats.total_passed.toLocaleString(), icon: Award, color: 'text-emerald-600' },
                            { label: 'Pass Rate', value: `${stats.pass_rate}%`, icon: TrendingUp, color: stats.pass_rate >= 50 ? 'text-emerald-600' : 'text-red-600' },
                            { label: 'Avg Score', value: stats.avg_score.toFixed(1), icon: BarChart3, color: 'text-violet-600' },
                        ].map((stat) => (
                            <Card key={stat.label}>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                                    </div>
                                    <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Schools */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-serif">Top Performing Schools</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {topSchools && topSchools.length > 0 ? (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left py-2 font-medium text-muted-foreground">#</th>
                                            <th className="text-left py-2 font-medium text-muted-foreground">School</th>
                                            <th className="text-right py-2 font-medium text-muted-foreground">Pass Rate</th>
                                            <th className="text-right py-2 font-medium text-muted-foreground">Avg</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topSchools.map((school, i) => (
                                            <tr key={i} className="border-b border-border last:border-0">
                                                <td className="py-2 text-muted-foreground">{i + 1}</td>
                                                <td className="py-2 font-medium text-foreground">{school.name}</td>
                                                <td className="py-2 text-right text-emerald-600 font-medium">{school.pass_rate}%</td>
                                                <td className="py-2 text-right text-muted-foreground">{school.avg_score.toFixed(1)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">No exam data available yet</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Subject Averages */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-serif">Subject Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {subjectAverages && subjectAverages.length > 0 ? (
                                <div className="space-y-3">
                                    {subjectAverages.map((subj, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <span className="text-sm text-foreground">{subj.subject}</span>
                                            <div className="flex items-center gap-3">
                                                <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-primary"
                                                        style={{ width: `${Math.min(subj.avg_score, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-medium text-foreground w-10 text-right">{subj.avg_score.toFixed(1)}</span>
                                                <Badge variant="outline" className="text-xs w-8 justify-center">{subj.grade}</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">No subject data available yet</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MinistryLayout>
    );
}
