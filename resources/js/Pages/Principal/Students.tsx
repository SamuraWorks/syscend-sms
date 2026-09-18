import { useState, useMemo } from 'react';
import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { GraduationCap, Search, Users, User, ChevronRight, UserPlus } from 'lucide-react';

interface Student {
    id: number; full_name: string; admission_no: string; gender: string | null;
    class: string | null; section: string | null; photo_url: string | null;
    status: string; guardian_name: string | null;
}
interface GenderBreakdown { [key: string]: number; }
interface RecentAdmission { id: number; full_name: string; class: string | null; admission_no: string; date: string; }
interface Props {
    linked: boolean; totalStudents: number;
    students: Student[]; genderBreakdown: GenderBreakdown;
    recentAdmissions: RecentAdmission[];
}

export default function Students({ linked, students, totalStudents, genderBreakdown, recentAdmissions }: Props) {
    const [search, setSearch] = useState('');

    if (!linked) {
        return (
            <AppLayout title="Students">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <GraduationCap className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const filtered = useMemo(() => {
        if (!search.trim()) return students;
        const q = search.toLowerCase();
        return students.filter(s =>
            s.full_name.toLowerCase().includes(q) || s.admission_no.toLowerCase().includes(q)
        );
    }, [students, search]);

    const grouped = useMemo(() => {
        const map = new Map<string, Student[]>();
        for (const s of filtered) {
            const key = `${s.class ?? '—'} — ${s.section ?? '—'}`;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(s);
        }
        return Array.from(map.entries());
    }, [filtered]);

    return (
        <AppLayout title="Students">
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/school/principal/dashboard" className="hover:text-slate-700 dark:hover:text-slate-300">Principal</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Students</span>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-500" /> Students
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5">{totalStudents} total students across all classes</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-2', 'bg-indigo-100 dark:bg-indigo-900/30')}>
                                <Users className="w-4 h-4 text-indigo-600" />
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalStudents}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Total Students</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-blue-100 dark:bg-blue-900/30">
                                <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{genderBreakdown.Male ?? genderBreakdown.male ?? 0}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Male Students</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-pink-100 dark:bg-pink-900/30">
                                <User className="w-4 h-4 text-pink-600" />
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{genderBreakdown.Female ?? genderBreakdown.female ?? 0}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Female Students</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Search by name or admission no…"
                        className="pl-9 h-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {grouped.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                            <p className="text-sm text-slate-400">No students found.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {grouped.map(([groupLabel, groupStudents]) => (
                            <div key={groupLabel}>
                                <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-3">
                                    {groupLabel} ({groupStudents.length})
                                </h2>
                                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-xs uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                                <th className="text-left py-3 px-4 font-medium">Student</th>
                                                <th className="text-left py-3 px-4 font-medium">Admission No</th>
                                                <th className="text-left py-3 px-4 font-medium">Gender</th>
                                                <th className="text-left py-3 px-4 font-medium">Guardian</th>
                                                <th className="text-left py-3 px-4 font-medium">Status</th>
                                                <th className="w-10 px-4" />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupStudents.map(s => (
                                                <tr key={s.id}
                                                    className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors"
                                                    onClick={() => window.location.href = `/school/principal/students/${s.id}`}
                                                >
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center shrink-0 text-xs font-bold text-indigo-600 dark:text-indigo-400 overflow-hidden">
                                                                {s.photo_url
                                                                    ? <img src={s.photo_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                                                                    : s.full_name[0]?.toUpperCase()
                                                                }
                                                            </div>
                                                            <p className="font-medium text-slate-900 dark:text-white">{s.full_name}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 font-mono text-slate-500">{s.admission_no}</td>
                                                    <td className="py-3 px-4 text-slate-500 capitalize">{s.gender ?? '—'}</td>
                                                    <td className="py-3 px-4 text-slate-500">{s.guardian_name ?? '—'}</td>
                                                    <td className="py-3 px-4">
                                                        <Badge variant="secondary" className="text-[10px] capitalize">{s.status}</Badge>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <ChevronRight className="w-4 h-4 text-slate-300" />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {recentAdmissions.length > 0 && (
                    <Card>
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <UserPlus className="w-4 h-4 text-emerald-500" /> Recent Admissions
                            </h2>
                        </div>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {recentAdmissions.map(a => (
                                    <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xs font-bold text-emerald-600">
                                            {a.full_name[0]?.toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{a.full_name}</p>
                                            <p className="text-xs text-slate-400">{a.class ?? '—'} · Adm# {a.admission_no}</p>
                                        </div>
                                        <span className="text-xs text-slate-400 shrink-0">{a.date}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
