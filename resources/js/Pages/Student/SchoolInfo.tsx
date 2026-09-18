import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { School, MapPin, Phone, Mail, DollarSign, Globe, Building } from 'lucide-react';

interface SchoolData {
    name: string; email: string | null; phone: string | null; address: string | null;
    city: string | null; state: string | null; country: string | null;
    logo_url: string | null; currency: string | null; currency_symbol: string | null;
}
interface Props { linked: boolean; school: SchoolData; }

function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                {icon}
            </div>
            <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{value}</p>
            </div>
        </div>
    );
}

export default function SchoolInfo({ linked, school }: Props) {
    if (!linked) {
        return (
            <AppLayout title="School Information">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Building className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const fullAddress = [school.address, school.city, school.state, school.country].filter(Boolean).join(', ');

    return (
        <AppLayout title="School Information">
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">School Information</h1>
                </div>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-5 mb-6">
                            <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                                {school.logo_url
                                    ? <img src={school.logo_url} alt={school.name} className="w-full h-full object-contain" />
                                    : <School className="w-10 h-10 text-slate-400" />}
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{school.name}</h2>
                                {fullAddress && <p className="text-sm text-slate-500">{fullAddress}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Field icon={<MapPin className="w-4 h-4 text-slate-500" />} label="Address" value={fullAddress || null} />
                            <Field icon={<Phone className="w-4 h-4 text-slate-500" />} label="Phone" value={school.phone} />
                            <Field icon={<Mail className="w-4 h-4 text-slate-500" />} label="Email" value={school.email} />
                            <Field
                                icon={<DollarSign className="w-4 h-4 text-slate-500" />}
                                label="Currency"
                                value={school.currency ? `${school.currency}${school.currency_symbol ? ` (${school.currency_symbol})` : ''}` : null}
                            />
                            <Field icon={<Globe className="w-4 h-4 text-slate-500" />} label="Country" value={school.country} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
