import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { Brain, CheckCircle2, Mic, Pause, Play, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Insight = { type?: string; title: string; message: string; priority?: string };
type IntelligenceData = { insights?: Insight[]; recommendations?: string[]; voice_report?: string; ai?: { message?: string } };

export default function EmbeddedIntelligence({ data, audience = 'student' }: { data?: IntelligenceData | null; audience?: 'student' | 'parent' }) {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [speaking, setSpeaking] = useState(false);
    const insights = data?.insights ?? [];
    const questions = audience === 'parent' ? ['How is my child progressing?', 'Which subjects need attention?', 'What should we discuss at home?'] : ['How am I performing this term?', 'Which subjects need attention?', 'What should I focus on this week?'];

    async function ask(value = question) {
        if (!value.trim() || busy) return;
        setBusy(true); setAnswer(null);
        try {
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
            const response = await fetch('/school/ai/intelligence/ask', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': token }, credentials: 'same-origin', body: JSON.stringify({ question: value }) });
            const body = await response.json();
            setAnswer(response.ok ? body.response?.answer ?? body.response : body.error ?? 'The AI service could not answer this question.');
        } catch { setAnswer('The AI service could not be reached. Please try again shortly.'); } finally { setBusy(false); }
    }

    function speak() {
        if (!data?.voice_report || !('speechSynthesis' in window)) return;
        if (speaking) { window.speechSynthesis.pause(); setSpeaking(false); return; }
        if (window.speechSynthesis.paused) { window.speechSynthesis.resume(); setSpeaking(true); return; }
        const utterance = new SpeechSynthesisUtterance(data.voice_report);
        utterance.onend = () => setSpeaking(false);
        window.speechSynthesis.cancel(); window.speechSynthesis.speak(utterance); setSpeaking(true);
    }

    return <section aria-labelledby="embedded-intelligence-title" className="space-y-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2"><Brain className="size-5 text-indigo-600" /><h2 id="embedded-intelligence-title" className="text-lg font-bold text-slate-900 dark:text-white">Syscend Intelligence</h2></div><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{audience === 'parent' ? "Stay informed about your child's academic progress, attendance and development." : 'Your personal academic assistant, helping you understand your progress and improve your performance.'}</p></div><Badge variant="outline" className="w-fit">Verified records</Badge></div>
        {insights.length > 0 && <div className="grid gap-3 md:grid-cols-2">{insights.map((item, index) => <div key={`${item.title}-${index}`} className="rounded-xl border bg-white/80 p-4 dark:bg-slate-950/40"><div className="flex items-start justify-between gap-3"><p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>{item.priority && <Badge variant={item.priority === 'high' ? 'destructive' : 'outline'}>{item.priority}</Badge>}</div><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.message}</p></div>)}</div>}
        <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]"><Card className="bg-white/80 dark:bg-slate-950/40"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Sparkles className="size-4 text-indigo-500" />Recommended next steps</CardTitle></CardHeader><CardContent className="space-y-2">{(data?.recommendations ?? ['Continue monitoring your next academic activity.']).map((item) => <div key={item} className="flex gap-2 text-sm"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" /><span>{item}</span></div>)}<Link href={audience === 'parent' ? '/school/parent/intelligence' : '/school/intelligence'} className="mt-2 inline-block text-sm font-semibold text-indigo-600">View detailed report</Link></CardContent></Card><Card className="bg-white/80 dark:bg-slate-950/40"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Mic className="size-4 text-indigo-500" />Listen to Your Academic Report</CardTitle><p className="text-xs text-slate-500">Let Syscend Intelligence explain your progress and areas requiring attention.</p></CardHeader><CardContent><details className="text-xs text-slate-500"><summary className="cursor-pointer">Read transcript</summary><p className="mt-2 leading-5">{data?.voice_report ?? 'A voice report will appear when verified records are available.'}</p></details><button type="button" onClick={speak} disabled={!data?.voice_report} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{speaking ? <Pause className="size-3" /> : <Play className="size-3" />}{speaking ? 'Pause report' : 'Play report'}</button></CardContent></Card></div>
        <div className="rounded-xl border bg-white/80 p-4 dark:bg-slate-950/40"><p className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Ask Syscend Intelligence</p><div className="flex flex-wrap gap-2">{questions.map((item) => <button key={item} type="button" onClick={() => { setQuestion(item); void ask(item); }} className="rounded-full border px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800">{item}</button>)}</div><div className="mt-3 flex gap-2"><input value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) void ask(); }} placeholder="Ask about your verified academic records" className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-sm" /><button type="button" disabled={busy || !question.trim()} onClick={() => void ask()} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Thinking…' : 'Ask'}</button></div>{answer && <p className="mt-3 rounded-lg bg-indigo-50 p-3 text-sm leading-6 text-slate-700 dark:bg-indigo-950/30 dark:text-slate-200">{answer}</p>}</div>
        {data?.ai?.message && <p className="text-xs text-slate-500">{data.ai.message}</p>}
    </section>;
}
