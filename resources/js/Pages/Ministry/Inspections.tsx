import MinistryLayout from '@/Layouts/MinistryLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Search, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { useState } from 'react';

interface InspectionData {
    id: number;
    school?: { name: string };
    inspection_type: string;
    status: string;
    scheduled_date: string;
    compliance_status?: string;
    score?: number;
}

interface Props {
    inspections: InspectionData[];
}

const STATUS_COLORS: Record<string, string> = {
    scheduled: 'text-amber-600 bg-amber-50',
    in_progress: 'text-blue-600 bg-blue-50',
    completed: 'text-emerald-600 bg-emerald-50',
    cancelled: 'text-muted-foreground bg-muted',
};

const COMPLIANCE_COLORS: Record<string, string> = {
    compliant: 'text-emerald-600 bg-emerald-50',
    partially_compliant: 'text-amber-600 bg-amber-50',
    non_compliant: 'text-red-600 bg-red-50',
};

export default function MinistryInspections({ inspections }: Props) {
    const [search, setSearch] = useState('');

    const filtered = inspections.filter((i) =>
        i.school?.name?.toLowerCase().includes(search.toLowerCase())
    );

    const stats = {
        total: inspections.length,
        scheduled: inspections.filter((i) => i.status === 'scheduled').length,
        completed: inspections.filter((i) => i.status === 'completed').length,
        nonCompliant: inspections.filter((i) => i.compliance_status === 'non_compliant').length,
    };

    return (
        <MinistryLayout title="Quality Assurance — Inspections">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                            <ShieldCheck className="w-6 h-6 text-primary" />
                            School Inspections
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Quality assurance and school compliance monitoring
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Inspections', value: stats.total, icon: ShieldCheck, color: 'text-primary' },
                        { label: 'Scheduled', value: stats.scheduled, icon: Clock, color: 'text-amber-600' },
                        { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-emerald-600' },
                        { label: 'Non-Compliant', value: stats.nonCompliant, icon: AlertTriangle, color: 'text-red-600' },
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

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg font-serif">Inspection Records</CardTitle>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search by school..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">School</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Scheduled</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Compliance</th>
                                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-muted-foreground">
                                                <ShieldCheck className="w-10 h-10 mx-auto mb-2 opacity-40" />
                                                <p>No inspection records</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map((insp) => (
                                            <tr key={insp.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                                <td className="py-3 px-4 font-medium text-foreground">{insp.school?.name ?? '—'}</td>
                                                <td className="py-3 px-4">
                                                    <Badge variant="outline" className="text-xs capitalize">{insp.inspection_type.replace('_', ' ')}</Badge>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[insp.status] ?? ''}`}>
                                                        {insp.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-muted-foreground">{new Date(insp.scheduled_date).toLocaleDateString()}</td>
                                                <td className="py-3 px-4">
                                                    {insp.compliance_status ? (
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${COMPLIANCE_COLORS[insp.compliance_status] ?? ''}`}>
                                                            {insp.compliance_status.replace('_', ' ')}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-right font-medium text-foreground">
                                                    {insp.score !== null && insp.score !== undefined ? insp.score.toFixed(1) : '—'}
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
