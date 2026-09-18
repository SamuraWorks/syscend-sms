import { Head } from '@inertiajs/react';
import SiteHeader from '@/components/landing/SiteHeader';
import SiteFooter from '@/components/landing/SiteFooter';

export default function About() {
    return (
        <div className="landing">
            <Head title="About Syscend — Syscend Campus" />
            <SiteHeader />
            <main className="bg-background pt-24 pb-20">
                <div className="mx-auto max-w-4xl px-6 lg:px-10">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1f66f5]">About Us</p>
                    <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                        Syscend builds what schools actually use
                    </h1>
                    <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                        Syscend is a small company building school management software for Sierra Leone and
                        West Africa. No offshore demos — the people fixing this system have sat in the offices
                        it&apos;s meant for.
                    </p>

                    <div className="mt-12 space-y-10">
                        <section>
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Who we are</h2>
                            <p className="mt-3 leading-relaxed text-muted-foreground">
                                We&apos;re not an enormous vendor. We&apos;re a team that has worked with Sierra Leone
                                schools first-hand — seen the register books, the fee ledgers, the exam reports
                                typed three times — and started from the job to be done instead of a feature list.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900">What we built</h2>
                            <p className="mt-3 leading-relaxed text-muted-foreground">
                                Syscend Campus holds student records, attendance, fees, payroll, examinations and
                                communication in one system. It follows the structure your school already uses —
                                class sections, form masters, NPSE, BECE and WASSCE — and produces reports the
                                exam office and the Ministry can read without re-entering a thing.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Why it matters</h2>
                            <p className="mt-3 leading-relaxed text-muted-foreground">
                                A school shouldn&apos;t need a big budget for software that actually helps. Syscend
                                Campus is priced for Sierra Leone schools and designed to run on modest
                                infrastructure — so the tool scales with the school, not the other way around.
                            </p>
                        </section>
                    </div>
                </div>
            </main>
            <SiteFooter />
        </div>
    );
}
