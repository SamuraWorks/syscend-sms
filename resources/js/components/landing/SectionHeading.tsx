interface SectionHeadingProps {
    eyebrow: string;
    title: string;
    description: string;
}

export default function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
    return (
        <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-blue-500">{eyebrow}</p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">{title}</h2>
            <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">{description}</p>
        </div>
    );
}
