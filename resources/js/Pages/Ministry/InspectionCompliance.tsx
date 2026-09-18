import MinistryLayout from '@/Layouts/MinistryLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, CheckCircle, AlertTriangle, School } from 'lucide-react';

interface NonCompliantSchool {
    id: number;
    name: string;
    district_id: number;
    inspection_status: string;
    district: { id: number; name: string } | null;
}

interface Props {
    compliance: Record<string, number>;
    nonCompliantSchools: NonCompliantSchool[];
    totalSchools: number;
}

export default function InspectionCompliance({ compliance, nonCompliantSchools, totalSchools }: Props) {
    const compliantCount = compliance['compliant'] ?? 0;
    const nonCompliantCount = compliance['non_compliant'] ?? 0;
    const partiallyCompliantCount = compliance['partially_compliant'] ?? 0;
    const notInspectedCount = totalSchools - compliantCount - nonCompliantCount - partiallyCompliantCount;

    const breakdownItems = [
        { label: 'Compliant', count: compliantCount, color: 'text-emerald-600 bg-emerald-50' },
        { label: 'Partially Compliant', count: partiallyCompliantCount, color: 'text-amber-600 bg-amber-50' },
        { label: 'Non-Compliant', count: nonCompliantCount, color: 'text-red-600 bg-red-50' },
        { label: 'Not Inspected', count: Math.max(0, notInspectedCount), color: 'text-muted-foreground bg-muted' },
    ];

    return (
        <MinistryLayout title="Quality Assurance — Compliance Monitoring">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                        <ClipboardList className="w-6 h-6 text-primary" />
                        Compliance Monitoring
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        School inspection compliance status across all districts
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Schools', value: totalSchools, icon: School, color: 'text-primary' },
                        { label: 'Compliant', value: compliantCount, icon: CheckCircle, color: 'text-emerald-600' },
                        { label: 'Partially Compliant', value: partiallyCompliantCount, icon: AlertTriangle, color: 'text-amber-600' },
                        { label: 'Non-Compliant', value: nonCompliantCount, icon: AlertTriangle, color: 'text-red-600' },
                    ].map((stat) => (
                        <Card key={stat.label}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                                        <stat.icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {breakdownItems.map((item) => {
                        const pct = totalSchools > 0 ? ((item.count / totalSchools) * 100).toFixed(1) : '0';
                        return (
                            <Card key={item.label}>
                                <CardContent className="p-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-foreground">{item.label}</span>
                                            <Badge variant="outline" className={`text-xs ${item.color}`}>{pct}%</Badge>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full bg-primary"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">{item.count} schools</p>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-serif">Non-Compliant Schools</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">School Name</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">District</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {nonCompliantSchools.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="py-12 text-center text-muted-foreground">
                                                <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
                                                <p>No non-compliant schools</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        nonCompliantSchools.map((school) => (
                                            <tr key={school.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                                <td className="py-3 px-4 font-medium text-foreground">{school.name}</td>
                                                <td className="py-3 px-4 text-muted-foreground">{school.district?.name ?? '—'}</td>
                                                <td className="py-3 px-4">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-red-600 bg-red-50">
                                                        Non-Compliant
                                                    </span>
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
