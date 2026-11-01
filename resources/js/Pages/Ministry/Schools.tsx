import MinistryLayout from '@/Layouts/MinistryLayout';
import { useRealtime } from '@/lib/useRealtime';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { School, Search, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface SchoolData {
    id: number;
    name: string;
    district?: { name: string };
    school_type: string;
    status: string;
    moe_approval_status: string;
    accreditation_status: string;
    inspection_status?: string;
}

interface Props {
    schools: SchoolData[];
}

const TYPE_LABELS: Record<string, string> = {
    government: 'Government',
    government_assisted: 'Govt Assisted',
    private: 'Private',
    community: 'Community',
};

const STATUS_COLORS: Record<string, string> = {
    active: 'text-emerald-600 bg-emerald-50',
    inactive: 'text-muted-foreground bg-muted',
    suspended: 'text-red-600 bg-red-50',
};

const APPROVAL_COLORS: Record<string, string> = {
    approved: 'text-emerald-600 bg-emerald-50',
    pending: 'text-amber-600 bg-amber-50',
    rejected: 'text-red-600 bg-red-50',
};

export default function MinistrySchools({ schools }: Props) {
    const [search, setSearch] = useState('');

    const filtered = schools.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.district?.name?.toLowerCase().includes(search.toLowerCase())
    );

    const stats = {
        total: schools.length,
        government: schools.filter((s) => s.school_type === 'government').length,
        pending: schools.filter((s) => s.moe_approval_status === 'pending').length,
        accredited: schools.filter((s) => s.accreditation_status === 'accredited').length,
    };

    useRealtime();

    return (
        <MinistryLayout title="National School Registry">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                            <School className="w-6 h-6 text-primary" />
                            National School Registry
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Overview of all registered schools across Sierra Leone
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Schools', value: stats.total, icon: School, color: 'text-primary' },
                        { label: 'Government Schools', value: stats.government, icon: School, color: 'text-emerald-600' },
                        { label: 'Pending Approval', value: stats.pending, icon: Clock, color: 'text-amber-600' },
                        { label: 'Accredited', value: stats.accredited, icon: CheckCircle, color: 'text-blue-600' },
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
                        <CardTitle className="text-lg font-serif">All Schools</CardTitle>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search schools..."
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
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">School Name</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">District</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Approval</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Accreditation</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-muted-foreground">
                                                <School className="w-10 h-10 mx-auto mb-2 opacity-40" />
                                                <p>No schools found</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map((school) => (
                                            <tr key={school.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                                <td className="py-3 px-4 font-medium text-foreground">{school.name}</td>
                                                <td className="py-3 px-4 text-muted-foreground">{school.district?.name ?? '—'}</td>
                                                <td className="py-3 px-4">
                                                    <Badge variant="outline" className="text-xs">
                                                        {TYPE_LABELS[school.school_type] ?? school.school_type}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[school.status] ?? ''}`}>
                                                        {school.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${APPROVAL_COLORS[school.moe_approval_status] ?? ''}`}>
                                                        {school.moe_approval_status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge variant="outline" className="text-xs">
                                                        {school.accreditation_status}
                                                    </Badge>
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
