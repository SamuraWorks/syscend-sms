import MinistryLayout from '@/Layouts/MinistryLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, UserX } from 'lucide-react';

interface UserData {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    status: string;
}

interface Props {
    users: UserData[];
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    active: 'default',
    inactive: 'secondary',
    suspended: 'destructive',
};

const STATUS_COLORS: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    inactive: 'bg-gray-50 text-gray-600 border-gray-200',
    suspended: 'bg-red-50 text-red-700 border-red-200',
};

export default function MinistryAdminUsers({ users }: Props) {
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.status === 'active').length;
    const inactiveUsers = users.filter((u) => u.status !== 'active').length;

    return (
        <MinistryLayout title="Ministry Users">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary" />
                        Ministry Users
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage ministry portal users and access
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Users className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">{totalUsers}</p>
                                    <p className="text-xs text-muted-foreground">Total Users</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-500/10">
                                    <UserCheck className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-emerald-600">{activeUsers}</p>
                                    <p className="text-xs text-muted-foreground">Active</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-muted">
                                    <UserX className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-muted-foreground">{inactiveUsers}</p>
                                    <p className="text-xs text-muted-foreground">Inactive</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-serif">All Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Phone</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Role</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-muted-foreground">
                                                <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                                                <p>No ministry users found</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        users.map((user) => (
                                            <tr key={user.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                                <td className="py-3 px-4 font-medium text-foreground">{user.name}</td>
                                                <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
                                                <td className="py-3 px-4 text-muted-foreground">{user.phone ?? '—'}</td>
                                                <td className="py-3 px-4">
                                                    <Badge variant="outline" className="text-xs capitalize">
                                                        {user.role}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge
                                                        variant={STATUS_VARIANT[user.status] ?? 'outline'}
                                                        className={`text-xs capitalize ${STATUS_COLORS[user.status] ?? ''}`}
                                                    >
                                                        {user.status}
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
