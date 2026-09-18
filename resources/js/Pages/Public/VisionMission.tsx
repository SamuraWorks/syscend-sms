import { Head } from '@inertiajs/react';
import SiteHeader from '@/components/landing/SiteHeader';
import SiteFooter from '@/components/landing/SiteFooter';
import { Target, Compass } from 'lucide-react';

export default function VisionMission() {
    return (
        <div className="landing">
            <Head title="Vision & Mission — Syscend Campus" />
            <SiteHeader />
            <main className="bg-background pt-24 pb-20">
                <div className="mx-auto max-w-4xl px-6 lg:px-10">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1f66f5]">Our Purpose</p>
                    <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                        Vision & Mission
                    </h1>

                    <div className="mt-12 grid gap-6 sm:grid-cols-2">
                        <div className="rounded-md border border-border bg-card p-8">
                            <span className="grid size-10 place-items-center rounded-sm bg-primary/10 text-primary">
                                <Compass className="size-5" />
                            </span>
                            <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">Our Vision</h2>
                            <p className="mt-4 text-muted-foreground leading-relaxed">
                                To become the leading school management platform in Sierra Leone by giving
                                schools an affordable, secure, and easy-to-use system that manages every
                                aspect of school operations.
                            </p>
                        </div>

                        <div className="rounded-md border border-accent/20 bg-accent/[0.06] p-8">
                            <span className="grid size-10 place-items-center rounded-sm bg-accent text-accent-foreground">
                                <Target className="size-5" />
                            </span>
                            <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">Our Mission</h2>
                            <p className="mt-4 text-muted-foreground leading-relaxed">
                                Help schools replace paper-based processes with one integrated platform for
                                administrators, teachers, students, parents, and accountants — starting in
                                Sierra Leone and expanding across West Africa.
                            </p>
                        </div>
                    </div>

                    <section className="mt-16">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Our values</h2>
                        <div className="mt-6 space-y-4">
                            {[
                                { title: 'Accessibility', desc: 'Every school, regardless of size or budget, deserves professional management tools.' },
                                { title: 'Security', desc: 'School data is sensitive. We protect it with encryption, isolation, and strict access controls.' },
                                { title: 'Simplicity', desc: 'Powerful features should not require complex training. We design for clarity and ease of use.' },
                                { title: 'Local focus', desc: 'We build for Sierra Leone\'s education system first, with plans to expand across West Africa.' },
                            ].map((v) => (
                                <div key={v.title} className="rounded-md border border-border bg-card p-5">
                                    <h3 className="text-sm font-medium text-foreground">{v.title}</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">{v.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </main>
            <SiteFooter />
        </div>
    );
}
