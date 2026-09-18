import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Building2, Phone, Mail, MapPin, Calendar, BookOpen, ChevronRight,
} from 'lucide-react';

interface School {
    name: string; motto: string | null; address: string | null;
    phone: string | null; email: string | null; logo_url: string | null;
}
interface AcademicYear { year: string; terms: string[]; }
interface Props {
    linked: boolean; school: School | null; academicCalendar: AcademicYear[];
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
    return (
        <div>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{value || '—'}</p>
        </div>
    );
}

export default function ProprietorSchoolInfo({ linked, school, academicCalendar }: Props) {
    if (!linked || !school) {
        return (
            <AppLayout title="School Information">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Building2 className="w-16 h-16 text-slate-300 mb-4" />
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Account not linked</h2>
                    <p className="text-slate-500 mt-2 max-w-sm">Your user account hasn&apos;t been linked yet. Please contact the system administrator.</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="School Information">
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/school/proprietor/dashboard" className="hover:text-slate-700 dark:hover:text-slate-300">Proprietor</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">School Info</span>
                </div>

                <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white flex items-center gap-5">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center overflow-hidden shrink-0">
                        {school.logo_url
                            ? <img src={school.logo_url} alt={school.name} className="w-full h-full object-cover" />
                            : <Building2 className="w-8 h-8 text-white/80" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold">{school.name}</h1>
                        {school.motto && <p className="text-white/80 text-sm italic">&ldquo;{school.motto}&rdquo;</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <Building2 className="w-4 h-4 text-emerald-500" /> School Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Field label="School Name" value={school.name} />
                            <Field label="Motto" value={school.motto} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <Phone className="w-4 h-4 text-blue-500" /> Contact Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <Phone className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Phone</p>
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{school.phone || '—'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                    <Mail className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Email</p>
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{school.email || '—'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                                    <MapPin className="w-4 h-4 text-violet-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Address</p>
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{school.address || '—'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <Calendar className="w-4 h-4 text-amber-500" /> Academic Calendar
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {academicCalendar.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-4">No academic calendar available.</p>
                        ) : (
                            <div className="space-y-4">
                                {academicCalendar.map((y, i) => (
                                    <div key={i}>
                                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">{y.year}</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {y.terms.map((t, j) => (
                                                <Badge key={j} variant="secondary" className="text-xs">
                                                    <BookOpen className="w-3 h-3 mr-1" /> {t}
                                                </Badge>
                                            ))}
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
