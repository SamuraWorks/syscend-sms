import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Users, HardDrive, Check, ArrowLeft } from 'lucide-react';

interface PackageModule {
    id: number;
    module_slug: string;
    module_label: string;
}

interface Package {
    id: number;
    name: string;
    description: string | null;
    price_per_term: string;
    price_monthly: string;
    price_yearly: string;
    max_students: number;
    max_staff: number;
    storage_gb: number;
    features: string[] | null;
    modules: PackageModule[];
}

interface Props {
    packages: Package[];
}

export default function PricingIndex({ packages }: Props) {
    return (
        <AppLayout title="Pricing">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pricing Plans</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Package pricing and included modules overview</p>
                    </div>
                    <Button variant="outline" onClick={() => router.get('/super-admin/subscriptions')} className="gap-2">
                        <ArrowLeft className="w-4 h-4" /> Back to Subscriptions
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {packages.map(pkg => (
                        <Card key={pkg.id} className="relative flex flex-col">
                            <CardHeader>
                                <CardTitle className="text-lg">{pkg.name}</CardTitle>
                                {pkg.description && (
                                    <p className="text-sm text-slate-500 mt-1">{pkg.description}</p>
                                )}
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col gap-4">
                                <div className="text-center py-4 border-b border-slate-100 dark:border-slate-700">
                                    <p className="text-3xl font-bold text-indigo-600">
                                        Le {Number(pkg.price_per_term).toLocaleString()}
                                    </p>
                                    <p className="text-sm text-slate-500 mt-1">per term</p>
                                    <div className="flex justify-center gap-4 mt-2 text-xs text-slate-400">
                                        <span>Le {Number(pkg.price_monthly).toLocaleString()}/mo</span>
                                        <span>Le {Number(pkg.price_yearly).toLocaleString()}/yr</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-center text-xs">
                                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded">
                                        <Users className="w-4 h-4 mx-auto text-slate-400 mb-1" />
                                        <p className="font-medium">{pkg.max_students.toLocaleString()}</p>
                                        <p className="text-slate-500">Students</p>
                                    </div>
                                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded">
                                        <Users className="w-4 h-4 mx-auto text-slate-400 mb-1" />
                                        <p className="font-medium">{pkg.max_staff.toLocaleString()}</p>
                                        <p className="text-slate-500">Staff</p>
                                    </div>
                                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded">
                                        <HardDrive className="w-4 h-4 mx-auto text-slate-400 mb-1" />
                                        <p className="font-medium">{pkg.storage_gb} GB</p>
                                        <p className="text-slate-500">Storage</p>
                                    </div>
                                </div>

                                {pkg.modules.length > 0 && (
                                    <div>
                                        <p className="text-xs font-medium text-slate-500 uppercase mb-2">Included Modules</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {pkg.modules.map(m => (
                                                <Badge key={m.id} variant="secondary" className="text-xs gap-1">
                                                    <Check className="w-3 h-3" /> {m.module_label}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {pkg.features && pkg.features.length > 0 && (
                                    <div>
                                        <p className="text-xs font-medium text-slate-500 uppercase mb-2">Features</p>
                                        <ul className="space-y-1">
                                            {pkg.features.map((f, i) => (
                                                <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                                                    <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
