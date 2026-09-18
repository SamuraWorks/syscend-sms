import { Head } from '@inertiajs/react';
import SiteHeader from '@/components/landing/SiteHeader';
import SiteFooter from '@/components/landing/SiteFooter';

export default function Terms() {
    return (
        <div className="landing">
            <Head title="Terms of Service — Syscend Campus" />
            <SiteHeader />
            <main className="bg-background pt-24 pb-20">
                <div className="mx-auto max-w-4xl px-6 lg:px-10">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1f66f5]">Legal</p>
                    <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                        Terms of Service
                    </h1>
                    <p className="mt-4 text-sm text-muted-foreground">Last updated: July 2026</p>

                    <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
                        <section>
                            <h2 className="text-xl font-bold tracking-tight text-slate-900">1. Acceptance</h2>
                            <p className="mt-3">
                                By accessing or using Syscend Campus, you agree to these Terms of Service.
                                If you are using the platform on behalf of a school, you represent that you
                                have the authority to bind that institution.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold tracking-tight text-slate-900">2. Service Description</h2>
                            <p className="mt-3">
                                Syscend Campus is a cloud-based school management platform that provides tools for
                                student management, attendance, examinations, fee management, payroll, communication,
                                and reporting. Features may vary based on subscription plan.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold tracking-tight text-slate-900">3. Account Responsibilities</h2>
                            <p className="mt-3">
                                School administrators are responsible for maintaining the security of their accounts,
                                managing user access within their school, and ensuring that all data entered into the
                                system is accurate and lawful.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold tracking-tight text-slate-900">4. Acceptable Use</h2>
                            <p className="mt-3">
                                You agree not to misuse the platform, attempt to access other schools&apos; data,
                                introduce malware, or use the service for any unlawful purpose. Violation may result
                                in account suspension or termination.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold tracking-tight text-slate-900">5. Intellectual Property</h2>
                            <p className="mt-3">
                                The Syscend Campus platform, including its design, code, and documentation, is owned
                                by Syscend. School data entered into the platform remains the property of the school.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold tracking-tight text-slate-900">6. Limitation of Liability</h2>
                            <p className="mt-3">
                                Syscend Campus is provided &quot;as is&quot; without warranties of uninterrupted service.
                                We are not liable for data loss, service disruptions, or damages arising from platform use.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold tracking-tight text-slate-900">7. Changes to Terms</h2>
                            <p className="mt-3">
                                We may update these terms from time to time. Continued use of the platform after
                                changes constitutes acceptance of the updated terms.
                            </p>
                        </section>
                    </div>
                </div>
            </main>
            <SiteFooter />
        </div>
    );
}
