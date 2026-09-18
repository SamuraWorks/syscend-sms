import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Mail, Clock, User } from 'lucide-react';

interface Message { id: number; subject: string; body: string; sender: string; is_read: boolean; created_at: string; }
interface Props { linked: boolean; guardian: { name: string } | null; messages: Message[]; }

export default function ParentCommunication({ linked, messages }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Communication">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <MessageSquare className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Communication">
            <div className="space-y-6">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Communication</h1>

                {messages.length === 0 ? (
                    <Card><CardContent className="py-16 text-center text-slate-400">No messages yet.</CardContent></Card>
                ) : (
                    <div className="space-y-3">
                        {messages.map(msg => (
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
                                                {!msg.is_read && (
                                                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3 h-3" /> {msg.sender}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {msg.created_at}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">{msg.body}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
