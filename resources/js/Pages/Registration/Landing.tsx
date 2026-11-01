import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { GraduationCap, Users, BadgeCheck, Briefcase, ArrowRight, ChevronLeft } from 'lucide-react';
import AuthLayout from '@/Layouts/AuthLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface School {
    id: number;
    name: string;
    slug: string;
    code: string | null;
}

interface Props {
    school: School;
}

const ACCOUNT_TYPES = [
    {
        id: 'student',
        title: 'Student',
        description: 'Register as a student to access your classes, homework, results, and more.',
        icon: GraduationCap,
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        border: 'border-blue-200 dark:border-blue-800',
        hoverBorder: 'hover:border-blue-400 dark:hover:border-blue-600',
        href: 'register/student',
    },
    {
        id: 'parent',
        title: 'Parent / Guardian',
        description: 'Register as a parent to monitor your children\'s academic progress and communicate with the school.',
        icon: Users,
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        border: 'border-emerald-200 dark:border-emerald-800',
        hoverBorder: 'hover:border-emerald-400 dark:hover:border-emerald-600',
        href: 'register/parent',
    },
    {
        id: 'teacher',
        title: 'Teacher',
        description: 'Register as a teacher to manage classes, mark results, upload lesson plans, and more.',
        icon: BadgeCheck,
        color: 'text-violet-600 dark:text-violet-400',
        bg: 'bg-violet-50 dark:bg-violet-950/30',
        border: 'border-violet-200 dark:border-violet-800',
        hoverBorder: 'hover:border-violet-400 dark:hover:border-violet-600',
        href: 'register/staff',
    },
    {
        id: 'staff',
        title: 'Staff',
        description: 'Register as non-teaching staff to access your dashboard, payroll, and school resources.',
        icon: Briefcase,
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        border: 'border-amber-200 dark:border-amber-800',
        hoverBorder: 'hover:border-amber-400 dark:hover:border-amber-600',
        href: 'register/staff',
    },
];

export default function RegistrationLanding({ school }: Props) {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    return (
        <AuthLayout>
            <Head title={`Register — ${school.name}`} />

            <div className="w-full max-w-lg">
                <Link href="/login" className="block text-center mb-8">
                    <span className="inline-flex w-16 h-16 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-md ring-1 ring-black/10 mb-4">
                        <img
                            src="/images/logo.png"
                            alt="Syscend Campus"
                            className="inline-block w-full h-full object-contain [filter:none]"
                        />
                    </span>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">
                        Create Your Syscend Campus Account
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">{school.name}</p>
                </Link>

                <Card className="shadow-xl border-0 bg-card">
                    <CardContent className="pt-6">
                        <div className="text-center mb-6">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Your school must have already added your details to the
                                Syscend Campus registry before you can register.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <p className="text-sm font-medium text-foreground">
                                Who are you registering as?
                            </p>

                            {ACCOUNT_TYPES.map((type) => {
                                const Icon = type.icon;
                                const isHovered = hoveredId === type.id;
                                const href = `/${school.slug}/${type.href}`;

                                return (
                                    <Link key={type.id} href={href} className="block">
                                        <div
                                            className={`
                                                relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer
                                                ${type.border} ${type.hoverBorder}
                                                ${isHovered ? 'shadow-md scale-[1.01]' : ''}
                                            `}
                                            onMouseEnter={() => setHoveredId(type.id)}
                                            onMouseLeave={() => setHoveredId(null)}
                                        >
                                            <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${type.bg}`}>
                                                <Icon className={`w-6 h-6 ${type.color}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-semibold text-foreground">
                                                    {type.title}
                                                </h3>
                                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                                    {type.description}
                                                </p>
                                            </div>
                                            <ArrowRight className={`w-4 h-4 flex-shrink-0 transition-all ${isHovered ? 'text-foreground translate-x-0.5' : 'text-muted-foreground'}`} />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col items-center gap-3 mt-6">
                    <p className="text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link
                            href="/login"
                            className="font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                            Sign in
                        </Link>
                    </p>
                    <Link href="/login" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronLeft className="w-3 h-3" />
                        Back to login
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
}
