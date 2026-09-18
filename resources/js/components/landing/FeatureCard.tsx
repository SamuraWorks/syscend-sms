import { Check } from 'lucide-react';

interface FeatureCardProps {
    title: string;
    description: string;
}

export default function FeatureCard({ title, description }: FeatureCardProps) {
    return (
        <article className="group overflow-hidden rounded-3xl border border-white/10 bg-white/90 p-6 shadow-xl shadow-slate-950/10 transition hover:-translate-y-1 hover:border-blue-500/20 hover:bg-white dark:bg-slate-950/95 dark:text-slate-100">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-3xl bg-blue-50 text-blue-700 shadow-sm shadow-blue-500/10 dark:bg-blue-500/10 dark:text-blue-300">
                <Check className="size-5" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p>
        </article>
    );
}
