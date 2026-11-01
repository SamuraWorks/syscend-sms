import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { useForm, Link } from '@inertiajs/react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Mail, Clock, User, Send, Inbox, ArrowUpRight, ChevronRight } from 'lucide-react';

interface InboxMsg { id: number; subject: string; body: string; sender: string; is_read: boolean; created_at: string; }
interface SentMsg { id: number; subject: string; recipient: string; is_read: boolean; created_at: string; }
interface UserEntry { id: number; name: string; }
interface Props {
    linked: boolean; inbox: InboxMsg[]; sent: SentMsg[]; users: UserEntry[];
}

export default function ProprietorMessages({ linked, inbox, sent, users }: Props) {
    const [tab, setTab] = useState<'inbox' | 'sent'>('inbox');
    const [composing, setComposing] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        recipient_id: '',
        subject: '',
        body: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/school/proprietor/messages/send', { onSuccess: () => { reset(); setComposing(false); } });
    }

    if (!linked) {
        return (
            <AppLayout title="Messages">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Mail className="w-16 h-16 text-slate-300 mb-4" />
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Account not linked</h2>
                    <p className="text-slate-500 mt-2 max-w-sm">Your user account hasn&apos;t been linked yet. Please contact the system administrator.</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Messages">
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/school/proprietor/dashboard" className="hover:text-slate-700 dark:hover:text-slate-300">Proprietor</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Messages</span>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Mail className="w-5 h-5 text-blue-500" /> Messages
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5">{inbox.length} received · {sent.length} sent</p>
                    </div>
                    <Button onClick={() => { reset(); setComposing(!composing); }} className="gap-2">
                        <Send className="w-4 h-4" /> Compose
                    </Button>
                </div>

                {composing && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <Send className="w-4 h-4 text-emerald-500" /> New Message
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Recipient</label>
                                    <select
                                        value={data.recipient_id}
                                        onChange={e => setData('recipient_id', e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    >
                                        <option value="">Select recipient</option>
                                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                    {errors.recipient_id && <p className="text-xs text-red-500 mt-1">{errors.recipient_id}</p>}
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Subject</label>
                                    <Input value={data.subject} onChange={e => setData('subject', e.target.value)} placeholder="Message subject" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Message</label>
                                    <textarea
                                        value={data.body}
                                        onChange={e => setData('body', e.target.value)}
                                        rows={4}
                                        placeholder="Write your message..."
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                                    />
                                    {errors.body && <p className="text-xs text-red-500 mt-1">{errors.body}</p>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button type="submit" disabled={processing} className="gap-2">
                                        <Send className="w-4 h-4" /> Send
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => setComposing(false)}>Cancel</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
                    <button
                        onClick={() => setTab('inbox')}
                        className={cn(
                            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                            tab === 'inbox'
                                ? 'border-emerald-600 text-emerald-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        )}
                    >
                        <Inbox className="w-4 h-4 inline mr-1.5" />
                        Inbox
                        {inbox.filter(m => !m.is_read).length > 0 && (
                            <Badge className="ml-2 text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">{inbox.filter(m => !m.is_read).length}</Badge>
                        )}
                    </button>
                    <button
                        onClick={() => setTab('sent')}
                        className={cn(
                            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                            tab === 'sent'
                                ? 'border-emerald-600 text-emerald-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        )}
                    >
                        <ArrowUpRight className="w-4 h-4 inline mr-1.5" />
                        Sent
                    </button>
                </div>

                {tab === 'inbox' && (
                    <div className="space-y-3">
                        {inbox.length === 0 ? (
                            <Card><CardContent className="py-16 text-center text-slate-400">No messages in inbox.</CardContent></Card>
                        ) : (
                            inbox.map(msg => (
                                <Card
                                    key={msg.id}
                                    className={cn(
                                        !msg.is_read && 'border-l-4 border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/10'
                                    )}
                                >
                                    <CardContent className="p-5">
                                        <div className="flex items-start gap-3">
                                            <div className={cn(
                                                'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                                                msg.is_read
                                                    ? 'bg-slate-100 dark:bg-slate-800'
                                                    : 'bg-blue-100 dark:bg-blue-900/30'
                                            )}>
                                                <Mail className={cn('w-4 h-4', msg.is_read ? 'text-slate-500' : 'text-blue-600 dark:text-blue-400')} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <h3 className={cn(
                                                        'text-sm truncate',
                                                        msg.is_read ? 'font-medium text-slate-700 dark:text-slate-300' : 'font-bold text-slate-900 dark:text-white'
                                                    )}>
                                                        {msg.subject}
                                                    </h3>
                                                    {!msg.is_read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                                                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {msg.sender}</span>
                                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {msg.created_at}</span>
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{msg.body}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                )}

                {tab === 'sent' && (
                    <div className="space-y-3">
                        {sent.length === 0 ? (
                            <Card><CardContent className="py-16 text-center text-slate-400">No sent messages.</CardContent></Card>
                        ) : (
                            sent.map(msg => (
                                <Card key={msg.id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                <ArrowUpRight className="w-4 h-4 text-slate-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{msg.subject}</h3>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                                    <span>To: {msg.recipient}</span>
                                                    <span>{msg.created_at}</span>
                                                    <Badge variant="secondary" className="text-[10px]">{msg.is_read ? 'Read' : 'Unread'}</Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
