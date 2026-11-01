import MinistryLayout from '@/Layouts/MinistryLayout';
import { useRealtime } from '@/lib/useRealtime';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, UserX } from 'lucide-react';

interface Officer {
    id: number;
    name: string;
    email: string;
    phone: string;
    status: string;
    district?: { id: number; name: string };
}

interface Props {
    officers: Officer[];
}

const STATUS_STYLES: Record<string, string> = {
    active: 'text-emerald-700 bg-emerald-50',
    inactive: 'text-muted-foreground bg-muted',
};

export default function DistrictOfficers({ officers }: Props) {
    const stats = {
        total: officers.length,
        active: officers.filter((o) => o.status === 'active').length,
    };

    useRealtime();

    return (
        <MinistryLayout title="District Officers">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary" />
                        District Officers
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Education officers assigned to districts
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-muted text-primary">
                                    <Users className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                                    <p className="text-xs text-muted-foreground">Total Officers</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-muted text-emerald-600">
                                    <UserCheck className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">{stats.active}</p>
                                    <p className="text-xs text-muted-foreground">Active Officers</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-serif">All Officers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Phone</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">District</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {officers.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-muted-foreground">
                                                <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                                                <p>No district officers found</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        officers.map((officer) => (
                                            <tr key={officer.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                                <td className="py-3 px-4 font-medium text-foreground">{officer.name}</td>
                                                <td className="py-3 px-4 text-muted-foreground">{officer.email ?? '—'}</td>
                                                <td className="py-3 px-4 text-muted-foreground">{officer.phone ?? '—'}</td>
                                                <td className="py-3 px-4 text-muted-foreground">{officer.district?.name ?? '—'}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[officer.status] ?? ''}`}>
                                                        {officer.status}
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
