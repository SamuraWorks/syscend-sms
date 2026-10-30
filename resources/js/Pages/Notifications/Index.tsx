import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Notification = { id: string; title: string; body: string; created_at: string | null; read: boolean; url?: string | null };
type Props = { notifications: { data: Notification[]; links?: { url: string | null; label: string; active: boolean }[] }; unread_count: number };

export default function NotificationIndex({ notifications, unread_count }: Props) {
    const [items, setItems] = useState(notifications.data ?? []);
    const [unread, setUnread] = useState(unread_count);

    async function post(path: string, id?: string) {
        const token = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
        const response = await fetch(path, { method: 'POST', headers: { Accept: 'application/json', 'X-CSRF-TOKEN': token }, credentials: 'same-origin' });
        if (!response.ok) return;
        if (id) { setItems((current) => current.map((item) => item.id === id ? { ...item, read: true } : item)); setUnread((current) => Math.max(0, current - 1)); }
        else { setItems((current) => current.map((item) => ({ ...item, read: true }))); setUnread(0); }
    }

    return <AppLayout title="Notifications"><main className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><Bell className="size-5 text-primary" /><h1 className="text-xl font-bold">Notifications</h1>{unread > 0 && <Badge>{unread} unread</Badge>}</div><p className="mt-1 text-sm text-muted-foreground">Important updates and alerts for your account.</p></div>{unread > 0 && <Button variant="outline" onClick={() => void post('/notifications/read-all')}><CheckCheck className="mr-2 size-4" />Mark all read</Button>}</div>
        <Card><CardHeader><CardTitle className="text-base">Recent activity</CardTitle></CardHeader><CardContent className="p-0">{items.length === 0 ? <div className="px-6 py-16 text-center"><Bell className="mx-auto mb-3 size-10 text-muted-foreground/40" /><p className="text-sm text-muted-foreground">You&apos;re all caught up.</p></div> : <div className="divide-y">{items.map((item) => <article key={item.id} className={`flex gap-4 px-4 py-4 sm:px-6 ${!item.read ? 'bg-primary/[0.04]' : ''}`}><div className={`mt-1 size-2 shrink-0 rounded-full ${item.read ? 'bg-muted' : 'bg-primary'}`} /><div className="min-w-0 flex-1"><div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between"><h2 className="text-sm font-semibold">{item.title}</h2><time className="shrink-0 text-xs text-muted-foreground">{item.created_at ? new Date(item.created_at).toLocaleString() : ''}</time></div><p className="mt-1 text-sm leading-6 text-muted-foreground">{item.body}</p><div className="mt-3 flex flex-wrap gap-3">{!item.read && <button type="button" className="text-xs font-semibold text-primary" onClick={() => void post(`/notifications/${item.id}/read`, item.id)}>Mark as read</button>}{item.url && <a href={item.url} className="inline-flex items-center text-xs font-semibold text-primary">View details <ExternalLink className="ml-1 size-3" /></a>}</div></div></article>)}</div>}</CardContent></Card>
        {notifications.links && notifications.links.length > 3 && <nav className="flex flex-wrap gap-2" aria-label="Notification pages">{notifications.links.map((link) => link.url ? <Link key={link.label} href={link.url} preserveScroll className={`rounded-md border px-3 py-1.5 text-xs ${link.active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`} dangerouslySetInnerHTML={{ __html: link.label }} /> : <span key={link.label} className="rounded-md border px-3 py-1.5 text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: link.label }} />)}</nav>}
    </main></AppLayout>;
}
