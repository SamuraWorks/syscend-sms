import MinistryLayout from '@/Layouts/MinistryLayout';
import { useRealtime } from '@/lib/useRealtime';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Search, Users } from 'lucide-react';
import { useState } from 'react';

interface StudentData {
    id: number;
    national_student_id: string;
    name: string;
    gender: string;
    school?: { name: string };
    district?: { name: string };
    current_level: string;
    status: string;
    enrollment_date: string;
}

interface Props {
    students: StudentData[];
}

const LEVEL_LABELS: Record<string, string> = {
    nursery: 'ECE / Nursery',
    primary: 'Primary',
    jss: 'Junior Secondary',
    sss: 'Senior Secondary',
};

const STATUS_COLORS: Record<string, string> = {
    active: 'text-emerald-600 bg-emerald-50',
    graduated: 'text-blue-600 bg-blue-50',
    transferred: 'text-amber-600 bg-amber-50',
    dropped_out: 'text-red-600 bg-red-50',
};

export default function MinistryStudents({ students }: Props) {
    const [search, setSearch] = useState('');

    const filtered = students.filter(
        (s) =>
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.national_student_id.toLowerCase().includes(search.toLowerCase())
    );

    const stats = {
        total: students.length,
        active: students.filter((s) => s.status === 'active').length,
        male: students.filter((s) => s.gender === 'male').length,
        female: students.filter((s) => s.gender === 'female').length,
    };

    useRealtime();

    return (
        <MinistryLayout title="National Student Registry">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                        <GraduationCap className="w-6 h-6 text-primary" />
                        National Student Registry
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        All registered students across Sierra Leone
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Students', value: stats.total, color: 'text-primary' },
                        { label: 'Active', value: stats.active, color: 'text-emerald-600' },
                        { label: 'Male', value: stats.male, color: 'text-blue-600' },
                        { label: 'Female', value: stats.female, color: 'text-violet-600' },
                    ].map((stat) => (
                        <Card key={stat.label}>
                            <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground">{stat.label}</p>
                                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value.toLocaleString()}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg font-serif">All Students</CardTitle>
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
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Gender</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">School</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">District</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Level</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-muted-foreground">
                                                <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-40" />
                                                <p>No students registered</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map((student) => (
                                            <tr key={student.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                                <td className="py-3 px-4 font-mono text-xs text-primary">{student.national_student_id}</td>
                                                <td className="py-3 px-4 font-medium text-foreground">{student.name}</td>
                                                <td className="py-3 px-4 text-muted-foreground capitalize">{student.gender}</td>
                                                <td className="py-3 px-4 text-muted-foreground">{student.school?.name ?? '—'}</td>
                                                <td className="py-3 px-4 text-muted-foreground">{student.district?.name ?? '—'}</td>
                                                <td className="py-3 px-4">
                                                    <Badge variant="outline" className="text-xs">{LEVEL_LABELS[student.current_level] ?? student.current_level}</Badge>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[student.status] ?? ''}`}>
                                                        {student.status.replace('_', ' ')}
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
