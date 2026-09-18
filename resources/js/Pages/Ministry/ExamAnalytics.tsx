import MinistryLayout from '@/Layouts/MinistryLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, FileText } from 'lucide-react';
import { Link } from '@inertiajs/react';

interface ByYear {
    exam_year: number;
    exam_type: string;
    total: number;
}

interface District {
    id: number;
    name: string;
    total_students: number;
}

interface Props {
    byType: Record<string, number>;
    byYear: ByYear[];
    resultByDistrict: District[];
    totalCandidates: number;
}

const EXAM_LABELS: Record<string, string> = {
    npse: 'NPSE',
    bece: 'BECE',
    wasse: 'WASSCE',
};

const EXAM_COLORS: Record<string, string> = {
    npse: 'text-indigo-600',
    bece: 'text-emerald-600',
    wasse: 'text-violet-600',
};

export default function ExamAnalytics({ byType, byYear, resultByDistrict, totalCandidates }: Props) {
    const tabs = [
        { key: 'npse', label: 'NPSE', href: '/ministry/exams/npse' },
        { key: 'bece', label: 'BECE', href: '/ministry/exams/bece' },
        { key: 'wasse', label: 'WASSCE', href: '/ministry/exams/wasse' },
        { key: 'analytics', label: 'Analytics', href: '/ministry/exams/analytics' },
    ];

    const allYears = [...new Set(byYear.map((y) => y.exam_year))].sort((a, b) => b - a);
    const examTypes = Object.keys(byType);

    return (
        <MinistryLayout title="National Examination Analytics">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-primary" />
                        National Examination Analytics
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Cross-examination statistics and trends
                    </p>
                </div>

                <div className="flex gap-1 border border-border rounded-lg p-1 bg-muted/30 w-fit">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.key}
                            href={tab.href}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                tab.key === 'analytics'
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                        >
                            {tab.label}
                        </Link>
                    ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <Users className="w-4 h-4 text-primary" />
                                <p className="text-xs text-muted-foreground">Total Candidates</p>
                            </div>
                            <p className="text-xl font-bold text-foreground">
                                {totalCandidates.toLocaleString()}
                            </p>
                        </CardContent>
                    </Card>
                    {examTypes.map((type) => (
                        <Card key={type}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <FileText className={`w-4 h-4 ${EXAM_COLORS[type] ?? 'text-muted-foreground'}`} />
                                    <p className="text-xs text-muted-foreground">
                                        {EXAM_LABELS[type] ?? type.toUpperCase()}
                                    </p>
                                </div>
                                <p className={`text-xl font-bold ${EXAM_COLORS[type] ?? 'text-foreground'}`}>
                                    {byType[type].toLocaleString()}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-serif">Candidates by Year and Exam Type</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Year</th>
                                        {examTypes.map((type) => (
                                            <th key={type} className="text-right px-4 py-3 font-medium text-muted-foreground">
                                                {EXAM_LABELS[type] ?? type.toUpperCase()}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {allYears.map((year) => (
                                        <tr key={year} className="border-b border-border last:border-0">
                                            <td className="px-4 py-3 font-medium text-foreground">{year}</td>
                                            {examTypes.map((type) => {
                                                const entry = byYear.find((y) => y.exam_year === year && y.exam_type === type);
                                                return (
                                                    <td key={type} className="px-4 py-3 text-right text-muted-foreground">
                                                        {entry ? entry.total.toLocaleString() : '-'}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-serif">District Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">#</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">District</th>
                                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total Students</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {resultByDistrict.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="text-center py-8 text-sm text-muted-foreground">
                                                No district data available
                                            </td>
                                        </tr>
                                    ) : (
                                        resultByDistrict.map((district, i) => (
                                            <tr key={district.id} className="border-b border-border last:border-0">
                                                <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                                                <td className="px-4 py-3 font-medium text-foreground">{district.name}</td>
                                                <td className="px-4 py-3 text-right text-muted-foreground">
                                                    {district.total_students.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MinistryLayout>
    );
}
