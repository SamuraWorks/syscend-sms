import { Head, useForm } from '@inertiajs/react';
import { Loader2, LockKeyhole, School } from 'lucide-react';

interface Portal { role: string; label: string; email: string }

export default function DemoPortal({ portals }: { portals: Portal[] }) {
    const form = useForm({ role: '' });

    return <div className="min-h-screen bg-slate-950 px-4 py-12 text-white sm:px-6">
        <Head title="Syscend Campus Demo" />
        <main className="mx-auto max-w-5xl">
            <div className="mb-10 max-w-2xl"><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200"><School className="h-3.5 w-3.5" /> Syscend Campus</div><h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Explore the actual campus application</h1><p className="mt-4 text-slate-300">Choose a role to enter the production portal experience with connected fictional records from Freetown International Academy.</p></div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{portals.map((portal) => <button key={portal.role} type="button" onClick={() => form.transform(() => ({ role: portal.role })).post('/demo/login')} className="group rounded-2xl border border-white/10 bg-white/[0.06] p-5 text-left transition hover:-translate-y-0.5 hover:border-indigo-300/60 hover:bg-white/[0.1] disabled:opacity-60" disabled={form.processing}><div className="flex items-start justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-400/15 text-indigo-200"><School className="h-5 w-5" /></div>{form.processing && form.data.role === portal.role ? <Loader2 className="h-4 w-4 animate-spin text-indigo-200" /> : <span className="text-xs text-slate-500">Enter</span>}</div><h2 className="mt-5 font-medium">{portal.label}</h2><p className="mt-1 text-xs text-slate-400">Same navigation, pages and permissions as production</p></button>)}</div>
            <div className="mt-8 flex items-center gap-2 text-xs text-slate-400"><LockKeyhole className="h-4 w-4" /> Demo identities and data are isolated fictional records. No payments, messages or production records are changed.</div>
        </main>
    </div>;
}
