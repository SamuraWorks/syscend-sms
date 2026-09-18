import { WifiOff, Smartphone, CloudUpload, Check } from 'lucide-react';
import { Link } from '@inertiajs/react';

const BULLETS = [
    'Take attendance and record CA marks without a connection — saved locally',
    'Cached students and classes keep working during network outages',
    'Everything syncs automatically once the network returns',
    'Install as a PWA from the browser for one-tap access',
];

export default function OfflineSection() {
    return (
        <section id="offline" className="bg-[#f4f7fb] py-20 lg:py-28">
            <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2 lg:px-10 lg:gap-16">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1f66f5]">
                        Works offline
                    </p>
                    <h2 className="mt-4 text-balance text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                        Keep working when the networks drop.
                    </h2>
                    <p className="mt-5 text-lg leading-relaxed text-slate-600">
                        A classroom in Makeni or Kabala shouldn&apos;t stop because the data network did.
                        Syscend Campus is built local-first: the register keeps filling in, and everything
                        flows into the system the moment you&apos;re back online.
                    </p>

                    <ul className="mt-8 space-y-4">
                        {BULLETS.map((point) => (
                            <li key={point} className="flex items-start gap-3">
                                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md bg-[#1f66f5] text-white">
                                    <Check className="size-3" aria-hidden="true" />
                                </span>
                                <span className="text-sm leading-relaxed text-slate-700">{point}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                        <Link
                            href="/start-trial"
                            className="inline-flex h-11 items-center justify-center rounded-[8px] bg-[#1f66f5] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#174ed7]"
                        >
                            Start free trial
                        </Link>
                        <Link
                            href="/request-demo"
                            className="inline-flex h-11 items-center justify-center rounded-[8px] border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400"
                        >
                            Book a demo
                        </Link>
                    </div>
                </div>

                <div className="relative">
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
                        <div className="reveal-grid grid gap-4">
                            <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#1f66f5]/10 text-[#1f66f5]">
                                    <WifiOff className="size-5" aria-hidden="true" />
                                </span>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Network lost</p>
                                    <p className="text-xs text-slate-500">Working from the local cache</p>
                                </div>
                                <span className="ml-auto rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                                    Offline
                                </span>
                            </div>

                            <div className="rounded-xl border border-slate-200 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Today&apos;s attendance
                                </p>
                                <div className="mt-3 space-y-2">
                                    {['Class 6A — 41 present', 'JSS 2B — 38 present', 'SSS 1 Science — 35 present'].map(
                                        (row) => (
                                            <div
                                                key={row}
                                                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"
                                            >
                                                {row}
                                                <span className="text-xs text-slate-400">saved locally</span>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-emerald-600/10 text-emerald-700">
                                    <CloudUpload className="size-5" aria-hidden="true" />
                                </span>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Synced</p>
                                    <p className="text-xs text-slate-500">Back online — queues emptied</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="absolute -bottom-5 -right-5 hidden items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg lg:flex">
                        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#ff5b3a]/10 text-[#ff5b3a]">
                            <Smartphone className="size-5" aria-hidden="true" />
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-slate-900">Installable PWA</p>
                            <p className="text-xs text-slate-500">One tap from the browser</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}