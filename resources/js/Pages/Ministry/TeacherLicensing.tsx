import MinistryLayout from '@/Layouts/MinistryLayout';
import { useRealtime } from '@/lib/useRealtime';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IdCard, ShieldCheck, Clock, Users } from 'lucide-react';

interface LicensedTeacher {
    id: number;
    national_teacher_id: string;
    name: string;
    email: string | null;
    school_id: number;
    qualification: string | null;
    licensing_status: string;
    school?: { id: number; name: string };
}

interface Props {
    byStatus: Record<string, number>;
    expired: LicensedTeacher[];
    pending: LicensedTeacher[];
    totalTeachers: number;
    licensedCount: number;
}

const statusBadge = (status: string) => {
    const map: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
        licensed: 'default',
        pending: 'secondary',
        expired: 'destructive',
        revoked: 'destructive',
    };
    return <Badge variant={map[status] ?? 'outline'} className="capitalize">{status}</Badge>;
};

function TeacherTable({ rows, empty }: { rows: LicensedTeacher[]; empty: string }) {
    if (rows.length === 0) {
        return <p className="text-sm text-muted-foreground text-center py-8">{empty}</p>;
    }
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Teacher ID</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">School</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Qualification</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((t) => (
                        <tr key={t.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                            <td className="py-3 px-4 font-mono text-xs text-foreground">{t.national_teacher_id}</td>
                            <td className="py-3 px-4 font-medium text-foreground">{t.name}</td>
                            <td className="py-3 px-4 text-foreground">{t.school?.name ?? '—'}</td>
                            <td className="py-3 px-4 text-muted-foreground">{t.qualification ?? '—'}</td>
                            <td className="py-3 px-4 text-muted-foreground">{t.email ?? '—'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function TeacherLicensing({ byStatus, expired, pending, totalTeachers, licensedCount }: Props) {
    const statusEntries = Object.entries(byStatus).sort((a, b) => b[1] - a[1]);
    const licensedPct = totalTeachers > 0 ? ((licensedCount / totalTeachers) * 100).toFixed(1) : '0';

    useRealtime();

    return (
        <MinistryLayout title="Teacher Licensing">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                        <IdCard className="w-6 h-6 text-primary" />
                        Teacher Licensing
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        National teacher licensing status and follow-up queues
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Teachers</p>
                                    <p className="text-3xl font-bold text-foreground">{totalTeachers.toLocaleString()}</p>
                                </div>
                                <Users className="w-8 h-8 text-primary/40" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Licensed</p>
                                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{licensedCount.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">{licensedPct}% of registry</p>
                                </div>
                                <ShieldCheck className="w-8 h-8 text-green-500/40" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Needs Action</p>
                                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                                        {(expired.length + pending.length).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground">expired or pending</p>
                                </div>
                                <Clock className="w-8 h-8 text-red-500/40" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-serif flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            Licensing Status Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {statusEntries.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
                        ) : (
                            <div className="space-y-3">
                                {statusEntries.map(([status, count]) => {
                                    const pct = totalTeachers > 0 ? ((count / totalTeachers) * 100).toFixed(1) : '0';
                                    return (
                                        <div key={status} className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-foreground capitalize flex items-center gap-2">
                                                    {status} {statusBadge(status)}
                                                </span>
                                                <span className="text-sm text-muted-foreground">{count.toLocaleString()} ({pct}%)</span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-3">
                                                <div
                                                    className={
                                                        'h-3 rounded-full ' +
                                                        (status === 'licensed'
                                                            ? 'bg-green-500'
                                                            : status === 'pending'
                                                                ? 'bg-amber-500'
                                                                : 'bg-red-500')
                                                    }
                                                    style={{ width: `${pct}%` }}
                                                />
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
                            <Clock className="w-5 h-5 text-destructive" />
                            Expired Licenses ({expired.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 pb-2">
                        <TeacherTable rows={expired} empty="No expired licenses — all up to date." />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-serif flex items-center gap-2">
                            <Clock className="w-5 h-5 text-amber-500" />
                            Pending Applications ({pending.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 pb-2">
                        <TeacherTable rows={pending} empty="No pending license applications." />
                    </CardContent>
                </Card>
            </div>
        </MinistryLayout>
    );
}
