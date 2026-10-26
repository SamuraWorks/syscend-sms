import { cn } from '@/lib/utils';

export default function Logo({
    className,
    showWordmark = true,
    tone = 'dark',
}: {
    className?: string;
    showWordmark?: boolean;
    tone?: 'dark' | 'light';
}) {
    const light = tone === 'light';

    return (
        <span className={cn('inline-flex items-center gap-2', className)}>
            <span className="relative inline-flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-black/10">
                <img
                    src="/images/logo.png"
                    alt="Syscend Campus"
                    className="size-full rounded-full object-cover"
                    draggable={false}
                />
            </span>
            {showWordmark && (
                <span
                    className={cn(
                        'text-xl font-bold tracking-tight',
                        light ? 'text-white' : 'text-foreground',
                    )}
                >
                    Syscend Campus
                </span>
            )}
        </span>
    );
}
