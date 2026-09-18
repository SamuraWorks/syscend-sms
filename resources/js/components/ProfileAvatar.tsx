import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ProfileAvatarProps {
    src?: string | null;
    name: string;
    size?: 'xs' | 'sm' | 'default' | 'lg' | 'xl' | '2xl';
    className?: string;
    showRing?: boolean;
    online?: boolean;
}

const sizeClasses: Record<string, string> = {
    xs:     'w-6 h-6 text-[10px]',
    sm:     'w-8 h-8 text-xs',
    default:'w-10 h-10 text-sm',
    lg:     'w-12 h-12 text-base',
    xl:     'w-16 h-16 text-xl',
    '2xl':  'w-24 h-24 text-3xl',
};

const avatarPrimitiveSize: Record<string, 'default' | 'sm' | 'lg'> = {
    xs: 'sm',
    sm: 'sm',
    default: 'default',
    lg: 'lg',
    xl: 'lg',
    '2xl': 'lg',
};

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function hashStringToColor(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
        'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
        'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
        'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
        'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
        'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
        'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
        'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
        'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
        'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300',
    ];
    return colors[Math.abs(hash) % colors.length];
}

export default function ProfileAvatar({
    src,
    name,
    size = 'default',
    className,
    showRing = false,
    online,
}: ProfileAvatarProps) {
    const initials = getInitials(name);
    const colorClass = hashStringToColor(name);
    const sizeClass = sizeClasses[size];
    const primitiveSize = avatarPrimitiveSize[size];

    return (
        <div className={cn('relative inline-flex shrink-0', className)}>
            <Avatar
                size={primitiveSize}
                className={cn(
                    sizeClass,
                    showRing && 'ring-2 ring-primary/30 ring-offset-2 ring-offset-background',
                )}
            >
                <AvatarImage
                    src={src ?? undefined}
                    alt={name}
                    className="object-cover"
                />
                <AvatarFallback className={cn('font-semibold', colorClass)}>
                    {initials}
                </AvatarFallback>
            </Avatar>
            {online !== undefined && (
                <span
                    className={cn(
                        'absolute bottom-0 right-0 block rounded-full ring-2 ring-background',
                        size === 'xs' || size === 'sm' ? 'w-2 h-2' : size === 'lg' || size === 'xl' || size === '2xl' ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5',
                        online ? 'bg-emerald-500' : 'bg-slate-400',
                    )}
                />
            )}
        </div>
    );
}
