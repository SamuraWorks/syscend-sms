import MinistryLayout from '@/Layouts/MinistryLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp, Award, AlertTriangle } from 'lucide-react';

interface RatingEntry {
    total: number;
    rating_label: string;
    score: number;
}

interface InspectionRecord {
    id: number;
    school_id: number;
    score: number;
    inspection_type: string;
    completed_date: string;
    school: { id: number; name: string } | null;
}

interface Props {
    ratings: RatingEntry[];
    avgScore: number | null;
    topSchools: InspectionRecord[];
    bottomSchools: InspectionRecord[];
}

const RATING_COLORS: Record<string, string> = {
    Excellent: 'text-emerald-600 bg-emerald-50',
    Good: 'text-blue-600 bg-blue-50',
    Satisfactory: 'text-amber-600 bg-amber-50',
    'Needs Improvement': 'text-orange-600 bg-orange-50',
    Critical: 'text-red-600 bg-red-50',
};

export default function InspectionRatings({ ratings, avgScore, topSchools, bottomSchools }: Props) {
    const aggregated = ratings.reduce<Record<string, { total: number; label: string }>>((acc, r) => {
        if (!acc[r.rating_label]) acc[r.rating_label] = { total: 0, label: r.rating_label };
        acc[r.rating_label].total += r.total;
        return acc;
    }, {});

    const distribution = Object.values(aggregated).sort((a, b) => b.total - a.total);
    const totalRated = distribution.reduce((sum, d) => sum + d.total, 0);

    return (
        <MinistryLayout title="Quality Assurance — School Ratings">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                        <Star className="w-6 h-6 text-primary" />
                        School Ratings
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Inspection score distribution and performance rankings
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-muted text-primary">
                                    <TrendingUp className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">{avgScore !== null ? avgScore.toFixed(1) : '—'}</p>
                                    <p className="text-xs text-muted-foreground">Average Score</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-muted text-emerald-600">
                                    <Award className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">{totalRated}</p>
                                    <p className="text-xs text-muted-foreground">Total Rated Inspections</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-muted text-red-600">
                                    <AlertTriangle className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">
                                        {distribution.find((d) => d.label === 'Critical')?.total ?? 0}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Critical Ratings</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-serif">Rating Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {distribution.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-6">No rating data available</p>
                            ) : (
                                distribution.map((item) => {
                                    const pct = totalRated > 0 ? ((item.total / totalRated) * 100).toFixed(1) : '0';
                                    return (
                                        <div key={item.label} className="flex items-center gap-4">
                                            <span className="w-36 text-sm font-medium text-foreground">{item.label}</span>
                                            <div className="flex-1 bg-muted rounded-full h-3">
                                                <div
                                                    className="h-3 rounded-full bg-primary"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium text-foreground w-12 text-right">{item.total}</span>
                                            <Badge variant="outline" className={`text-xs w-16 justify-center ${RATING_COLORS[item.label] ?? ''}`}>{pct}%</Badge>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-serif flex items-center gap-2">
                                <Award className="w-5 h-5 text-emerald-600" />
                                Top 10 Schools
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">#</th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">School</th>
                                            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Score</th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topSchools.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-muted-foreground">No data</td>
                                            </tr>
                                        ) : (
                                            topSchools.map((s, i) => (
                                                <tr key={s.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                                    <td className="py-3 px-4 text-muted-foreground">{i + 1}</td>
                                                    <td className="py-3 px-4 font-medium text-foreground">{s.school?.name ?? '—'}</td>
                                                    <td className="py-3 px-4 text-right font-bold text-foreground">{s.score.toFixed(1)}</td>
                                                    <td className="py-3 px-4">
                                                        <Badge variant="outline" className="text-xs capitalize">{s.inspection_type.replace('_', ' ')}</Badge>
                                                    </td>
                                                    <td className="py-3 px-4 text-muted-foreground">{s.completed_date ? new Date(s.completed_date).toLocaleDateString() : '—'}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-serif flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                                Bottom 10 Schools
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">#</th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">School</th>
                                            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Score</th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bottomSchools.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-muted-foreground">No data</td>
                                            </tr>
                                        ) : (
                                            bottomSchools.map((s, i) => (
                                                <tr key={s.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                                    <td className="py-3 px-4 text-muted-foreground">{i + 1}</td>
                                                    <td className="py-3 px-4 font-medium text-foreground">{s.school?.name ?? '—'}</td>
                                                    <td className="py-3 px-4 text-right font-bold text-foreground">{s.score.toFixed(1)}</td>
                                                    <td className="py-3 px-4">
                                                        <Badge variant="outline" className="text-xs capitalize">{s.inspection_type.replace('_', ' ')}</Badge>
                                                    </td>
                                                    <td className="py-3 px-4 text-muted-foreground">{s.completed_date ? new Date(s.completed_date).toLocaleDateString() : '—'}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MinistryLayout>
    );
}
