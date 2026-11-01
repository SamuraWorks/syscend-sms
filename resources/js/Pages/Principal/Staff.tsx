import { useState } from 'react';
import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { UserCog as StaffIcon, Search, Users, ChevronRight, Phone, Mail } from 'lucide-react';

interface StaffMember {
    id: number; full_name: string; emp_id: string | null; gender: string | null;
    phone: string | null; email: string | null; photo_url: string | null;
    status: string; department: string | null; designation: string | null;
    teacher_type: string | null;
}
interface DeptCount { department: string; count: number; }
interface LeaveRequest { id: number; staff_name: string; leave_type: string; start_date: string; end_date: string; days: number; reason: string | null; }
interface Props {
    linked: boolean;
    principal: { full_name: string };
    staff: StaffMember[];
    staffByDepartment: DeptCount[];
    pendingLeaveRequests: LeaveRequest[];
}

export default function Staff({ linked, principal, staff, staffByDepartment, pendingLeaveRequests }: Props) {
    const [search, setSearch] = useState('');

    if (!linked) {
        return (
            <AppLayout title="Staff">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <StaffIcon className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const q = search.toLowerCase();
    const filtered = search.trim()
        ? staff.filter(s => s.full_name.toLowerCase().includes(q) || (s.department && s.department.toLowerCase().includes(q)) || (s.designation && s.designation.toLowerCase().includes(q)))
        : staff;

    return (
        <AppLayout title="Staff">
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/school/principal/dashboard" className="hover:text-slate-700 dark:hover:text-slate-300">Principal</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Staff</span>
                </div>

                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <StaffIcon className="w-5 h-5 text-violet-500" /> Staff Members
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">{staff.length} total staff</p>
                </div>

                {staffByDepartment.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {staffByDepartment.map(d => (
                            <Card key={d.department}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', 'bg-violet-100 dark:bg-violet-900/30')}>
                                            <Users className="w-4 h-4 text-violet-600" />
                                        </div>
                                        <Badge variant="outline" className="text-[10px]">{d.count}</Badge>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{d.department}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{d.count} {d.count === 1 ? 'member' : 'members'}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {pendingLeaveRequests.length > 0 && (
                    <Card>
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">{pendingLeaveRequests.length}</Badge>
                                Pending Leave Requests
                            </h2>
                        </div>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {pendingLeaveRequests.map(lr => (
                                    <div key={lr.id} className="px-4 py-3">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{lr.staff_name}</p>
                                            <Badge variant="outline" className="text-[10px]">{lr.leave_type}</Badge>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">{lr.start_date} — {lr.end_date} ({lr.days} days)</p>
                                        {lr.reason && <p className="text-xs text-slate-500 mt-0.5">{lr.reason}</p>}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder="Search by name, department, or designation…" className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
                </div>

                {filtered.length === 0 ? (
                    <Card><CardContent className="py-16 text-center"><StaffIcon className="w-10 h-10 mx-auto mb-3 text-slate-300" /><p className="text-sm text-slate-400">No staff found.</p></CardContent></Card>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                    <th className="text-left py-3 px-4 font-medium">Staff</th>
                                    <th className="text-left py-3 px-4 font-medium">Employee ID</th>
                                    <th className="text-left py-3 px-4 font-medium">Department</th>
                                    <th className="text-left py-3 px-4 font-medium">Designation</th>
                                    <th className="text-left py-3 px-4 font-medium">Contact</th>
                                    <th className="text-left py-3 px-4 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(s => (
                                    <tr key={s.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center shrink-0 text-xs font-bold text-violet-600 dark:text-violet-400 overflow-hidden">
                                                    {s.photo_url ? <img src={s.photo_url} className="w-full h-full object-cover" alt="" /> : s.full_name[0]?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">{s.full_name}</p>
                                                    {s.email && <p className="text-xs text-slate-400">{s.email}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 font-mono text-slate-500">{s.emp_id ?? '—'}</td>
                                        <td className="py-3 px-4 text-slate-500">{s.department ?? '—'}</td>
                                        <td className="py-3 px-4 capitalize text-slate-500">{s.designation ?? '—'}</td>
                                        <td className="py-3 px-4 text-slate-500">{s.phone ?? '—'}</td>
                                        <td className="py-3 px-4">
                                            <Badge variant="secondary" className={cn('text-[10px] capitalize', s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500')}>{s.status}</Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
