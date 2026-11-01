import { useState, useMemo } from 'react';
import { router, usePage, Head, Link } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, GraduationCap, ArrowRight } from 'lucide-react';
import type { PageProps } from '@/Types';

interface School {
    id: number;
    name: string;
    slug: string;
}

interface RegisterProps extends PageProps {
    schools: School[];
}

export default function Register() {
    const { schools, schoolBranding } = usePage<RegisterProps>().props;
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        if (!search.trim()) return schools;
        const q = search.toLowerCase();
        return schools.filter((s) => s.name.toLowerCase().includes(q));
    }, [search, schools]);

    return (
        <AuthLayout>
            <Head title="Register" />

            <div className="w-full max-w-md">
                <Link href="/" className="block text-center mb-8">
                    <span className="inline-flex w-16 h-16 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-md ring-1 ring-black/10 mb-4">
                        <img
                            src={schoolBranding?.logo_url || "/images/logo.png"}
                            alt={schoolBranding?.name || "Syscend Campus"}
                            className="inline-block w-full h-full object-contain [filter:none]"
                        />
                    </span>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">
                        Find Your School
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Search for your school to register
                    </p>
                </Link>

                <Card className="shadow-xl border-0 bg-card">
                    <CardContent className="p-6 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Type your school name..."
                                className="pl-9 h-10"
                                autoFocus
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2 max-h-80 overflow-y-auto">
                            {filtered.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-6">
                                    No schools found. Try a different search.
                                </p>
                            )}
                            {filtered.map((school) => (
                                <button
                                    key={school.id}
                                    onClick={() => router.get(`/${school.slug}/register`)}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-[#1f66f5]/40 hover:bg-[#1f66f5]/5 transition-all text-left group"
                                >
                                    <div className="p-2 rounded-lg bg-slate-100 text-slate-500 group-hover:text-[#1f66f5] transition-colors">
                                        <GraduationCap className="w-5 h-5" />
                                    </div>
                                    <span className="flex-1 text-sm font-medium text-slate-900 truncate">
                                        {school.name}
                                    </span>
                                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#1f66f5] transition-colors" />
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-muted-foreground mt-6">
                    &copy; {new Date().getFullYear()} Syscend Campus. All rights reserved.
                </p>

                <p className="text-center text-sm text-muted-foreground mt-4">
                    Already have an account?{' '}
                    <Link href="/login" className="font-medium text-primary hover:text-primary/80 transition-colors">
                        Sign in
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
