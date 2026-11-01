import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Phone, Calendar, Briefcase } from 'lucide-react';

interface Staff {
    id: number; first_name: string; last_name: string; full_name: string;
    emp_id: string; email: string | null; phone: string | null;
    gender: string | null; date_of_birth: string | null; photo_url: string | null;
    joining_date: string | null; status: string;
}
interface Props {
    linked: boolean; staff: Staff | null;
}

export default function Profile({ linked, staff }: Props) {
    if (!linked || !staff) {
        return (
            <AppLayout title="Profile">
                <div className="text-center py-12 text-muted-foreground">Access denied.</div>
            </AppLayout>
        );
    }

    const fields = [
        { icon: Briefcase, label: 'Employee ID', value: staff.emp_id },
        { icon: Mail, label: 'Email', value: staff.email },
        { icon: Phone, label: 'Phone', value: staff.phone },
        { icon: User, label: 'Gender', value: staff.gender },
        { icon: Calendar, label: 'Date of Birth', value: staff.date_of_birth ? new Date(staff.date_of_birth).toLocaleDateString() : '—' },
        { icon: Calendar, label: 'Joining Date', value: staff.joining_date ? new Date(staff.joining_date).toLocaleDateString() : '—' },
    ];

    return (
        <AppLayout title="Profile">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Store Manager Profile</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {fields.map((f) => (
                                <div key={f.label} className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-muted">
                                        <f.icon className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">{f.label}</p>
                                        <p className="font-medium">{f.value || '—'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
