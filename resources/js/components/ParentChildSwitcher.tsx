import { router } from '@inertiajs/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users } from 'lucide-react';

interface ChildOption {
    id: number;
    full_name: string;
}

interface Props {
    childrenIndex?: ChildOption[];
    selectedChild?: string | number | null;
}

/**
 * Child switcher for the parent portal.
 * Updates the ?child= query parameter so the backend filters all
 * per-child data server-side (ownership is re-verified on every request).
 */
export default function ParentChildSwitcher({ childrenIndex = [], selectedChild }: Props) {
    if (!childrenIndex || childrenIndex.length < 2) return null;

    const current = selectedChild ? String(selectedChild) : 'all';

    function handleChange(value: string) {
        router.get(window.location.pathname, value === 'all' ? {} : { child: value }, {
            preserveState: true,
            preserveScroll: true,
        });
    }

    return (
        <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <Select defaultValue={current} onValueChange={handleChange}>
                <SelectTrigger className="w-[200px] h-9">
                    <SelectValue placeholder="View child" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All children</SelectItem>
                    {childrenIndex.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.full_name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
