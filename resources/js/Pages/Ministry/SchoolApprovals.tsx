import MinistryLayout from '@/Layouts/MinistryLayout';
import { useRealtime } from '@/lib/useRealtime';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, CheckCircle, XCircle, Clock, School } from 'lucide-react';
import { router } from '@inertiajs/react';
import { useState } from 'react';

interface PendingSchool {
    id: number;
    name: string;
    slug: string;
    district_id: number;
    school_type: string;
    status: string;
    moe_approval_status: string;
    email: string;
    phone: string;
    created_at: string;
    district?: { id: number; name: string };
}

interface Props {
    pendingSchools: PendingSchool[];
}

const TYPE_LABELS: Record<string, string> = {
    government: 'Government',
    government_assisted: 'Govt Assisted',
    private: 'Private',
    community: 'Community',
};

export default function SchoolApprovals({ pendingSchools }: Props) {
    const [processing, setProcessing] = useState<number | null>(null);

    const stats = {
        total: pendingSchools.length,
    };

    const handleApprove = (id: number) => {
        setProcessing(id);
        router.post(`/ministry/schools/${id}/approve`, {}, {
            onFinish: () => setProcessing(null),
        });
    };

    const handleReject = (id: number) => {
        setProcessing(id);
        router.patch(`/ministry/schools/${id}/suspend`, {}, {
            onFinish: () => setProcessing(null),
        });
    };

    useRealtime();

    return (
        <MinistryLayout title="Pending School Approvals">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                        <ClipboardCheck className="w-6 h-6 text-primary" />
                        Pending School Approvals
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Schools awaiting Ministry approval
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-muted text-amber-600">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                                    <p className="text-xs text-muted-foreground">Total Pending</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-serif">Pending Schools</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">School Name</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">District</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Phone</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Registered</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingSchools.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-muted-foreground">
                                                <School className="w-10 h-10 mx-auto mb-2 opacity-40" />
                                                <p>No pending schools</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        pendingSchools.map((school) => (
                                            <tr key={school.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                                <td className="py-3 px-4 font-medium text-foreground">{school.name}</td>
                                                <td className="py-3 px-4 text-muted-foreground">{school.district?.name ?? '—'}</td>
                                                <td className="py-3 px-4">
                                                    <Badge variant="outline" className="text-xs">
                                                        {TYPE_LABELS[school.school_type] ?? school.school_type}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4 text-muted-foreground">{school.email ?? '—'}</td>
                                                <td className="py-3 px-4 text-muted-foreground">{school.phone ?? '—'}</td>
                                                <td className="py-3 px-4 text-muted-foreground">
                                                    {new Date(school.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleApprove(school.id)}
                                                            disabled={processing === school.id}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                                                        >
                                                            <CheckCircle className="w-3 h-3" />
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(school.id)}
                                                            disabled={processing === school.id}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                                                        >
                                                            <XCircle className="w-3 h-3" />
                                                            Reject
                                                        </button>
                                                    </div>
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
