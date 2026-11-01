import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router, Head, Link } from '@inertiajs/react';
import { toast } from 'sonner';

import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

const schema = z.object({
    name: z.string().min(2, 'School name is required'),
    code: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    admin_name: z.string().min(2, 'Admin name is required'),
    admin_email: z.string().email('Valid admin email is required'),
    admin_phone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function CreateWithAdmin() {
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '', code: '', email: '', phone: '', address: '',
            admin_name: '', admin_email: '', admin_phone: '',
        },
    });

    const onSubmit = (data: FormData) => {
        router.post('/super-admin/schools/create-with-admin', data, {
            onError: (errs) => {
                Object.entries(errs).forEach(([field, message]) => {
                    setError(field as keyof FormData, { message });
                });
                if (errs.message) toast.error(errs.message);
            },
            onSuccess: () => {
                toast.success('School and School Admin created successfully.');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { label: 'Schools', href: '/super-admin/schools' },
            { label: 'Create School with Admin' },
        ]}>
            <Head title="Create School with Admin" />

            <div className="max-w-2xl space-y-6">
                <div className="flex items-center gap-3 mb-6">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/super-admin/schools"><ArrowLeft className="w-4 h-4" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Create School with Admin</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Create a new school and provision its initial School Admin account with temporary credentials.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
                    {/* School Section */}
                    <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">School Information</CardTitle>
                            <CardDescription>Basic details about the school</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    School Name <span className="text-red-500">*</span>
                                </Label>
                                <Input {...register('name')} placeholder="e.g. Freetown Academy" className="h-9" />
                                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">School Code</Label>
                                    <Input {...register('code')} placeholder="e.g. FA-001" className="h-9" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">School Email</Label>
                                    <Input {...register('email')} type="email" placeholder="info@school.edu" className="h-9" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone</Label>
                                    <Input {...register('phone')} placeholder="+232 XX XXX XXXX" className="h-9" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Address</Label>
                                    <Input {...register('address')} placeholder="School address" className="h-9" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Admin Section */}
                    <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">School Admin Account</CardTitle>
                            <CardDescription>
                                The initial administrator for this school. They will receive a temporary password and must change it on first login.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Admin Full Name <span className="text-red-500">*</span>
                                </Label>
                                <Input {...register('admin_name')} placeholder="e.g. John Kamara" className="h-9" />
                                {errors.admin_name && <p className="text-xs text-red-500">{errors.admin_name.message}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Admin Email <span className="text-red-500">*</span>
                                    </Label>
                                    <Input {...register('admin_email')} type="email" placeholder="admin@school.edu" className="h-9" />
                                    {errors.admin_email && <p className="text-xs text-red-500">{errors.admin_email.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Admin Phone</Label>
                                    <Input {...register('admin_phone')} placeholder="+232 XX XXX XXXX" className="h-9" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex gap-3 justify-end">
                        <Button type="button" variant="outline" asChild>
                            <Link href="/super-admin/schools">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {isSubmitting ? 'Creating…' : 'Create School & Admin'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
