export default function LandingFooter() {
    return (
        <footer className="border-t border-slate-200/70 bg-slate-50 px-6 py-10 text-slate-700 dark:border-slate-800/70 dark:bg-slate-950 dark:text-slate-300 sm:px-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-4">
                    <div className="text-xl font-semibold text-slate-950 dark:text-white">Syscend Campus</div>
                    <p className="max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-400">
                        School management built for Sierra Leone&apos;s schools — registers, fees, and results
                        in one place, ready for national reporting.
                    </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-900 dark:text-white">Contact</p>
                        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">syscend@gmail.com</p>
                        <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">WhatsApp: +232 79 630 777</p>
                    </div>
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-900 dark:text-white">Platform</p>
                        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">Powered by Syscend</p>
                    </div>
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-900 dark:text-white">Legal</p>
                        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">© 2026 Syscend. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
