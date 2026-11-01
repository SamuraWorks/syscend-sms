import { Head } from '@inertiajs/react';
import SiteHeader from '@/components/landing/SiteHeader';
import SiteFooter from '@/components/landing/SiteFooter';

export default function Privacy() {
    return (
        <div className="landing">
            <Head title="Privacy Policy — Syscend Campus" />
            <SiteHeader />
            <main className="bg-background pt-24 pb-20">
                <div className="mx-auto max-w-4xl px-6 lg:px-10">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1f66f5]">Legal</p>
                    <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                        Privacy Policy
                    </h1>
                    <p className="mt-4 text-sm text-muted-foreground">Last updated: July 2026</p>

                    <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
                        <section>
                            <h2 className="text-xl font-bold tracking-tight text-slate-900">1. Information We Collect</h2>
                            <p className="mt-3">
                                Syscend Campus collects information necessary to provide school management services,
                                including student records, staff information, attendance data, examination results,
                                and financial transactions. We also collect account information such as names,
                                email addresses, and phone numbers for authentication and communication.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold tracking-tight text-slate-900">2. How We Use Information</h2>
                            <p className="mt-3">
                                We use collected information to operate and improve the platform, provide customer
                                support, send important service updates, and ensure the security of school data.
                                We do not sell or share personal information with third parties for marketing purposes.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold tracking-tight text-slate-900">3. Data Security</h2>
                            <p className="mt-3">
                                All data is encrypted in transit and at rest. Each school&apos;s data is completely
                                isolated from other schools. We implement industry-standard security practices
                                including role-based access control, audit logging, and regular security assessments.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold tracking-tight text-slate-900">4. Data Retention</h2>
                            <p className="mt-3">
                                School data is retained for as long as the school account is active. Upon account
                                closure, data is securely deleted within 90 days unless otherwise required by law
                                or contractual agreement.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold tracking-tight text-slate-900">5. Your Rights</h2>
                            <p className="mt-3">
                                School administrators can access, export, or delete their school&apos;s data at any
                                time through the platform settings. Individual users may request data access or
                                deletion through their school administrator.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold tracking-tight text-slate-900">6. Contact</h2>
                            <p className="mt-3">
                                For privacy-related questions, contact us at{' '}
                                <a href="mailto:syscend@gmail.com" className="text-primary hover:text-primary/80 transition-colors">
                                    syscend@gmail.com
                                </a>.
                            </p>
                        </section>
                    </div>
                </div>
            </main>
            <SiteFooter />
        </div>
    );
}
