import MinistryLayout from '@/Layouts/MinistryLayout';
import { useRealtime } from '@/lib/useRealtime';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserCog, Search } from 'lucide-react';
import { useState } from 'react';

interface TeacherData {
    id: number;
    national_teacher_id: string;
    name: string;
    qualification: string;
    specialization: string;
    school?: { name: string };
    years_of_experience: number;
    employment_status: string;
    licensing_status: string;
}

interface Props {
    teachers: TeacherData[];
}

const LICENSE_COLORS: Record<string, string> = {
    licensed: 'text-emerald-600 bg-emerald-50',
    pending: 'text-amber-600 bg-amber-50',
    expired: 'text-red-600 bg-red-50',
};

const STATUS_COLORS: Record<string, string> = {
    active: 'text-emerald-600 bg-emerald-50',
    on_leave: 'text-amber-600 bg-amber-50',
    retired: 'text-muted-foreground bg-muted',
    transferred: 'text-blue-600 bg-blue-50',
};

export default function MinistryTeachers({ teachers }: Props) {
    const [search, setSearch] = useState('');

    const filtered = teachers.filter(
        (t) =>
            t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.national_teacher_id.toLowerCase().includes(search.toLowerCase())
    );

    const stats = {
        total: teachers.length,
        licensed: teachers.filter((t) => t.licensing_status === 'licensed').length,
        pending: teachers.filter((t) => t.licensing_status === 'pending').length,
        active: teachers.filter((t) => t.employment_status === 'active').length,
    };

    useRealtime();

    return (
        <MinistryLayout title="National Teacher Registry">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                        <UserCog className="w-6 h-6 text-primary" />
                        National Teacher Registry
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        All registered teachers across Sierra Leone
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Teachers', value: stats.total, color: 'text-primary' },
                        { label: 'Licensed', value: stats.licensed, color: 'text-emerald-600' },
                        { label: 'Pending License', value: stats.pending, color: 'text-amber-600' },
                        { label: 'Active', value: stats.active, color: 'text-blue-600' },
                    ].map((stat) => (
                        <Card key={stat.label}>
                            <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground">{stat.label}</p>
                                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg font-serif">All Teachers</CardTitle>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search by name or ID..."
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
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">National ID</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Qualification</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Specialization</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">School</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Experience</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">License</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="py-12 text-center text-muted-foreground">
                                                <UserCog className="w-10 h-10 mx-auto mb-2 opacity-40" />
                                                <p>No teachers registered</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map((teacher) => (
                                            <tr key={teacher.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                                <td className="py-3 px-4 font-mono text-xs text-primary">{teacher.national_teacher_id}</td>
                                                <td className="py-3 px-4 font-medium text-foreground">{teacher.name}</td>
                                                <td className="py-3 px-4 text-muted-foreground">{teacher.qualification}</td>
                                                <td className="py-3 px-4 text-muted-foreground">{teacher.specialization}</td>
                                                <td className="py-3 px-4 text-muted-foreground">{teacher.school?.name ?? '—'}</td>
                                                <td className="py-3 px-4 text-muted-foreground">{teacher.years_of_experience} yrs</td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${LICENSE_COLORS[teacher.licensing_status] ?? ''}`}>
                                                        {teacher.licensing_status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[teacher.employment_status] ?? ''}`}>
                                                        {teacher.employment_status.replace('_', ' ')}
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
