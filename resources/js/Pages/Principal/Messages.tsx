import { useState } from 'react';
import { Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, ChevronRight, Send, Inbox, Mail } from 'lucide-react';

interface InboxMessage { id: number; subject: string; body: string; sender: string; is_read: boolean; created_at: string; }
interface SentMessage { id: number; subject: string; recipient: string; is_read: boolean; created_at: string; }
interface UserOption { id: number; name: string; }
interface Props { linked: boolean; inbox: InboxMessage[]; sent: SentMessage[]; users: UserOption[]; }

type Tab = 'inbox' | 'sent';

export default function Messages({ linked, inbox, sent, users }: Props) {
    const [tab, setTab] = useState<Tab>('inbox');
    const [composing, setComposing] = useState(false);
    const { data, setData, post, processing, reset } = useForm({
        recipient_id: '',
        subject: '',
        body: '',
    });

    if (!linked) {
        return (
            <AppLayout title="Messages">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <MessageSquare className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const unreadCount = inbox.filter(m => !m.is_read).length;

    const handleSend = () => {
        if (!data.recipient_id || !data.subject.trim() || !data.body.trim()) return;
        post('/school/principal/messages/send', {
            onSuccess: () => {
                reset();
                setComposing(false);
                setTab('sent');
            },
        });
    };

    return (
        <AppLayout title="Messages">
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/school/principal/dashboard" className="hover:text-slate-700 dark:hover:text-slate-300">Principal</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Messages</span>
                </div>

                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-blue-500" /> Messages
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5">Internal messaging</p>
                    </div>
                    <Button size="sm" onClick={() => setComposing(c => !c)}>
                        <Send className="w-4 h-4 mr-1.5" /> {composing ? 'Cancel' : 'New Message'}
                    </Button>
                </div>

                {composing && (
                    <Card>
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                            <Send className="w-4 h-4 text-blue-500" />
                            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Compose Message</h2>
                        </div>
                        <CardContent className="p-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Recipient</label>
                                    <Select value={data.recipient_id} onValueChange={v => setData('recipient_id', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={users.length ? 'Select a recipient…' : 'No users available'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users.map(u => (
                                                <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Subject</label>
                                    <Input
                                        placeholder="Message subject…"
                                        value={data.subject}
                                        onChange={e => setData('subject', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Message</label>
                                <Textarea
                                    placeholder="Type your message…"
                                    className="min-h-[120px] max-h-[280px] resize-none"
                                    value={data.body}
                                    onChange={e => setData('body', e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={handleSend} disabled={!data.recipient_id || !data.subject.trim() || !data.body.trim() || processing}>
                                    <Send className="w-4 h-4 mr-1.5" /> {processing ? 'Sending…' : 'Send'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="flex items-center gap-1 border-b border-slate-100 dark:border-slate-800">
                    <button
                        onClick={() => setTab('inbox')}
                        className={cn(
                            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2',
                            tab === 'inbox'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
                        )}
                    >
                        <Inbox className="w-4 h-4" /> Inbox
                        {unreadCount > 0 && (
                            <Badge variant="destructive" className="h-5 min-w-5 px-1 text-[10px]">{unreadCount}</Badge>
                        )}
                    </button>
                    <button
                        onClick={() => setTab('sent')}
                        className={cn(
                            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2',
                            tab === 'sent'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
                        )}
                    >
                        <Mail className="w-4 h-4" /> Sent
                    </button>
                </div>

                {tab === 'inbox' ? (
                    <Card>
                        <CardContent className="p-0">
                            {inbox.length === 0 ? (
                                <div className="py-16 text-center">
                                    <Inbox className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                                    <p className="text-sm text-slate-400">Your inbox is empty.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {inbox.map(m => (
                                        <div key={m.id} className={cn('px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors', !m.is_read && 'bg-blue-50/50 dark:bg-blue-950/10')}>
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        {!m.is_read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                                                        <p className={cn('truncate', m.is_read ? 'text-sm font-medium text-slate-700 dark:text-slate-300' : 'text-sm font-semibold text-slate-900 dark:text-white')}>{m.subject}</p>
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-0.5 truncate">{m.sender}</p>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{m.body}</p>
                                                </div>
                                                <div className="shrink-0 text-right space-y-1">
                                                    <p className="text-[11px] text-slate-400">{m.created_at}</p>
                                                    {m.is_read
                                                        ? <Badge variant="secondary" className="text-[10px]">Read</Badge>
                                                        : <Badge className="text-[10px]">Unread</Badge>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="p-0">
                            {sent.length === 0 ? (
                                <div className="py-16 text-center">
                                    <Mail className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                                    <p className="text-sm text-slate-400">You haven&apos;t sent any messages.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {sent.map(m => (
                                        <div key={m.id} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{m.subject}</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">To: {m.recipient}</p>
                                                </div>
                                                <div className="shrink-0 text-right space-y-1">
                                                    <p className="text-[11px] text-slate-400">{m.created_at}</p>
                                                    {m.is_read
                                                        ? <Badge variant="secondary" className="text-[10px]">Read</Badge>
                                                        : <Badge variant="outline" className="text-[10px]">Delivered</Badge>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
