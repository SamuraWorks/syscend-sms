import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Phone, Mail, Users, MapPin, Briefcase, Link as LinkIcon } from 'lucide-react';

interface Child { id: number; full_name: string; admission_no: string; class: string | null; section: string | null; }
interface Props {
    linked: boolean;
    guardian: { id: number; name: string; phone: string; email: string | null; relation: string | null; address: string | null; occupation: string | null; };
    children: Child[];
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) {
    if (!value) return null;
    return (
        <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{value}</p>
            </div>
        </div>
    );
}

export default function ParentProfile({ linked, guardian, children }: Props) {
    if (!linked) {
        return (
            <AppLayout title="My Profile">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <User className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="My Profile">
            <div className="space-y-6">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">My Profile</h1>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <User className="w-4 h-4 text-violet-500" /> Guardian Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                        <InfoRow icon={<User className="w-4 h-4 text-slate-500" />} label="Name" value={guardian.name} />
                        <InfoRow icon={<Phone className="w-4 h-4 text-slate-500" />} label="Phone" value={guardian.phone} />
                        <InfoRow icon={<Mail className="w-4 h-4 text-slate-500" />} label="Email" value={guardian.email} />
                        <InfoRow icon={<LinkIcon className="w-4 h-4 text-slate-500" />} label="Relation" value={guardian.relation} />
                        <InfoRow icon={<MapPin className="w-4 h-4 text-slate-500" />} label="Address" value={guardian.address} />
                        <InfoRow icon={<Briefcase className="w-4 h-4 text-slate-500" />} label="Occupation" value={guardian.occupation} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <Users className="w-4 h-4 text-violet-500" /> Children ({children.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                        {children.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-4">No children linked.</p>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {children.map(child => (
                                    <div key={child.id} className="py-3 first:pt-0 last:pb-0">
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{child.full_name}</p>
                                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500 mt-0.5">
                                            <span>Adm: {child.admission_no}</span>
                                            {child.class && <span>Class: {child.class}</span>}
                                            {child.section && <span>Section: {child.section}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
