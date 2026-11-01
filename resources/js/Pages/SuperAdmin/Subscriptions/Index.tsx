import AppLayout from '@/Layouts/AppLayout';
import { useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Activity, Clock, AlertTriangle, TrendingUp, DollarSign, Smartphone } from 'lucide-react';

interface School   { id: number; name: string; }
interface Pkg      { id: number; name: string; price_per_term: string; }
interface Coupon   { id: number; code: string; type: string; value: string; }
interface Payment  { id: number; amount: string; method: string; status: string; paid_at: string | null; payer_phone: string | null; }
interface Sub {
    id: number; status: string; is_trial: boolean; start_date: string; end_date: string;
    term_number: number | null; price_per_term: string; amount_paid: string;
    payment_method: string | null; notes: string | null; balance: number;
    school: School; package: Pkg; coupon: Coupon | null; confirmed_payments: Payment[];
}
interface Meta { total: number; per_page: number; current_page: number; last_page: number; }
interface Kpi  {
    total: number; active: number; trial: number; expired: number;
    total_revenue: number; pending_balances: number;
}
interface Props {
    subscriptions: { data: Sub[]; meta: Meta };
    schools: School[]; packages: Pkg[]; coupons: Coupon[];
    kpi: Kpi; filters: { school_id?: string; status?: string };
}

const STATUS_COLORS: Record<string, string> = {
    active:    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    trial:     'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    expired:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    suspended: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const TERM_LABELS: Record<number, string> = { 1: 'Term 1', 2: 'Term 2', 3: 'Term 3' };

export default function SubscriptionsIndex({ subscriptions, schools, packages, coupons, kpi, filters }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [editSub, setEditSub]     = useState<Sub | null>(null);
    const [delSub, setDelSub]       = useState<Sub | null>(null);
    const [paySub, setPaySub]       = useState<Sub | null>(null);
    const [viewPayments, setViewPayments] = useState<Sub | null>(null);
    const [schoolFilter, setSchoolFilter] = useState(filters.school_id ?? '');
    const [statusFilter, setStatusFilter] = useState(filters.status ?? '');

    const form = useForm({
        school_id: '', package_id: '', coupon_id: '',
        start_date: '', end_date: '', status: 'active',
        term_number: '1', price_per_term: '',
        is_trial: false, trial_ends_at: '',
        amount_paid: '0', payment_method: '', notes: '',
    });

    const offlinePaymentForm = useForm({
        amount: '', method: 'orange_money', notes: '',
    });

    const onlinePaymentForm = useForm({
        phone: '', method: 'orange_money',
    });

    function applyFilters(overrides: Record<string, string> = {}) {
        router.get('/super-admin/subscriptions', { school_id: schoolFilter, status: statusFilter, ...overrides }, { preserveState: true, replace: true });
    }

    function openCreate() {
        form.reset(); form.clearErrors(); setEditSub(null); setShowModal(true);
    }
    function openEdit(s: Sub) {
        form.setData({
            school_id: String(s.school.id), package_id: String(s.package.id),
            coupon_id: s.coupon ? String(s.coupon.id) : '',
            start_date: s.start_date, end_date: s.end_date, status: s.status,
            term_number: s.term_number ? String(s.term_number) : '1',
            price_per_term: s.price_per_term,
            is_trial: s.is_trial, trial_ends_at: '',
            amount_paid: s.amount_paid, payment_method: s.payment_method ?? '', notes: s.notes ?? '',
        });
        form.clearErrors(); setEditSub(s); setShowModal(true);
    }
    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (editSub) {
            form.put(`/super-admin/subscriptions/${editSub.id}`, { onSuccess: () => setShowModal(false) });
        } else {
            form.post('/super-admin/subscriptions', { onSuccess: () => setShowModal(false) });
        }
    }
    function confirmDelete() {
        if (!delSub) return;
        router.delete(`/super-admin/subscriptions/${delSub.id}`, { onSuccess: () => setDelSub(null) });
    }
    function submitOfflinePayment(e: React.FormEvent) {
        e.preventDefault();
        if (!paySub) return;
        offlinePaymentForm.post(`/super-admin/subscriptions/${paySub.id}/offline-payment`, {
            onSuccess: () => { setPaySub(null); offlinePaymentForm.reset(); },
        });
    }
    function submitOnlinePayment(e: React.FormEvent) {
        e.preventDefault();
        if (!paySub) return;
        onlinePaymentForm.post(`/super-admin/subscriptions/${paySub.id}/online-payment`, {});
    }
    function handlePackageChange(pkgId: string) {
        const pkg = packages.find(p => String(p.id) === pkgId);
        if (pkg) {
            form.setData('package_id', pkgId);
            form.setData('price_per_term', pkg.price_per_term);
        }
    }

    return (
        <AppLayout title="Subscriptions">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Subscriptions</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Manage school subscriptions, payments and billing</p>
                    </div>
                    <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Assign Subscription</Button>
                </div>

                {/* KPI */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[
                        { label: 'Total', value: kpi.total,              icon: TrendingUp,      color: 'text-indigo-500' },
                        { label: 'Active', value: kpi.active,            icon: Activity,        color: 'text-green-500' },
                        { label: 'Trial',  value: kpi.trial,             icon: Clock,           color: 'text-blue-500' },
                        { label: 'Expired',value: kpi.expired,           icon: AlertTriangle,   color: 'text-red-500' },
                        { label: 'Revenue',value: `Le ${kpi.total_revenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-500' },
                        { label: 'Pending',value: `Le ${kpi.pending_balances.toLocaleString()}`, icon: CreditCard, color: 'text-amber-500' },
                    ].map(k => (
                        <Card key={k.label}>
                            <CardContent className="pt-4 pb-4 flex items-center gap-3">
                                <k.icon className={`w-8 h-8 ${k.color} shrink-0`} />
                                <div>
                                    <p className="text-xl font-bold text-slate-900 dark:text-white">{k.value}</p>
                                    <p className="text-xs text-slate-500">{k.label}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-4 flex flex-wrap gap-3">
                        <Select value={schoolFilter || '_all'} onValueChange={v => { setSchoolFilter(v === '_all' ? '' : v); applyFilters({ school_id: v === '_all' ? '' : v }); }}>
                            <SelectTrigger className="w-52"><SelectValue placeholder="All Schools" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="_all">All Schools</SelectItem>
                                {schools.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter || '_all'} onValueChange={v => { setStatusFilter(v === '_all' ? '' : v); applyFilters({ status: v === '_all' ? '' : v }); }}>
                            <SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="_all">All Status</SelectItem>
                                {['active','trial','expired','suspended'].map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <CreditCard className="w-4 h-4 text-indigo-500" /> Subscriptions ({subscriptions.meta.total})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-700 text-xs uppercase text-slate-500">
                                        <th className="text-left py-3 px-4 font-medium">School</th>
                                        <th className="text-left py-3 px-4 font-medium">Package</th>
                                        <th className="text-left py-3 px-4 font-medium">Term</th>
                                        <th className="text-left py-3 px-4 font-medium">Period</th>
                                        <th className="text-left py-3 px-4 font-medium">Status</th>
                                        <th className="text-right py-3 px-4 font-medium">Price</th>
                                        <th className="text-right py-3 px-4 font-medium">Balance</th>
                                        <th className="text-right py-3 px-4 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subscriptions.data.length === 0 && (
                                        <tr><td colSpan={8} className="text-center py-10 text-slate-400">No subscriptions yet.</td></tr>
                                    )}
                                    {subscriptions.data.map(s => (
                                        <tr key={s.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="py-3 px-4 font-medium">{s.school.name}</td>
                                            <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{s.package.name}</td>
                                            <td className="py-3 px-4 text-slate-500 text-xs">
                                                {s.term_number ? TERM_LABELS[s.term_number] : '—'}
                                            </td>
                                            <td className="py-3 px-4 text-slate-500 text-xs">
                                                {new Date(s.start_date).toLocaleDateString()} → {new Date(s.end_date).toLocaleDateString()}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_COLORS[s.status] ?? ''}`}>
                                                    {s.status.replace('_', ' ')}
                                                </span>
                                                {s.is_trial && <span className="ml-1 text-xs text-blue-500">(trial)</span>}
                                            </td>
                                            <td className="py-3 px-4 text-right">Le {Number(s.price_per_term).toLocaleString()}</td>
                                            <td className="py-3 px-4 text-right">
                                                {s.balance > 0 ? (
                                                    <span className="text-amber-600 font-medium">Le {s.balance.toLocaleString()}</span>
                                                ) : (
                                                    <span className="text-green-600">Paid</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    {s.balance > 0 && (
                                                        <button onClick={() => { setPaySub(s); offlinePaymentForm.reset(); onlinePaymentForm.reset(); }}
                                                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-emerald-600" title="Record Payment">
                                                            <DollarSign className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    <button onClick={() => setViewPayments(s)}
                                                        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-600" title="Payment History">
                                                        <CreditCard className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600">
                                                        <Edit className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => setDelSub(s)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-red-600">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {subscriptions.meta.last_page > 1 && (
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <p className="text-sm text-slate-500">Page {subscriptions.meta.current_page} of {subscriptions.meta.last_page}</p>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" disabled={subscriptions.meta.current_page <= 1} onClick={() => applyFilters({ page: String(subscriptions.meta.current_page - 1) })}><ChevronLeft className="w-4 h-4" /></Button>
                                    <Button variant="outline" size="sm" disabled={subscriptions.meta.current_page >= subscriptions.meta.last_page} onClick={() => applyFilters({ page: String(subscriptions.meta.current_page + 1) })}><ChevronRight className="w-4 h-4" /></Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Create/Edit Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{editSub ? 'Edit Subscription' : 'Assign Subscription'}</DialogTitle></DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        {!editSub && (
                            <div>
                                <Label>School *</Label>
                                <Select value={form.data.school_id} onValueChange={v => form.setData('school_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select school" /></SelectTrigger>
                                    <SelectContent>{schools.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                                </Select>
                                {form.errors.school_id && <p className="text-xs text-red-500 mt-1">{form.errors.school_id}</p>}
                            </div>
                        )}
                        <div>
                            <Label>Package *</Label>
                            <Select value={form.data.package_id} onValueChange={handlePackageChange}>
                                <SelectTrigger><SelectValue placeholder="Select package" /></SelectTrigger>
                                <SelectContent>{packages.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name} (Le {p.price_per_term}/term)</SelectItem>)}</SelectContent>
                            </Select>
                            {form.errors.package_id && <p className="text-xs text-red-500 mt-1">{form.errors.package_id}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Term *</Label>
                                <Select value={form.data.term_number} onValueChange={v => form.setData('term_number', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {[1,2,3].map(t => <SelectItem key={t} value={String(t)}>{TERM_LABELS[t]}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                {form.errors.term_number && <p className="text-xs text-red-500 mt-1">{form.errors.term_number}</p>}
                            </div>
                            <div>
                                <Label>Price per Term (Le) *</Label>
                                <Input type="number" step="0.01" value={form.data.price_per_term} onChange={e => form.setData('price_per_term', e.target.value)} />
                                {form.errors.price_per_term && <p className="text-xs text-red-500 mt-1">{form.errors.price_per_term}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Start Date *</Label>
                                <Input type="date" value={form.data.start_date} onChange={e => form.setData('start_date', e.target.value)} />
                                {form.errors.start_date && <p className="text-xs text-red-500 mt-1">{form.errors.start_date}</p>}
                            </div>
                            <div>
                                <Label>End Date *</Label>
                                <Input type="date" value={form.data.end_date} onChange={e => form.setData('end_date', e.target.value)} />
                                {form.errors.end_date && <p className="text-xs text-red-500 mt-1">{form.errors.end_date}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Status *</Label>
                                <Select value={form.data.status} onValueChange={v => form.setData('status', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
{['active','trial','expired','suspended'].map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Coupon</Label>
                                <Select value={form.data.coupon_id || '_none'} onValueChange={v => form.setData('coupon_id', v === '_none' ? '' : v)}>
                                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="_none">None</SelectItem>
                                        {coupons.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.code} ({c.type === 'percent' ? `${c.value}%` : `Le ${c.value}`})</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="is_trial" checked={form.data.is_trial}
                                onChange={e => form.setData('is_trial', e.target.checked)} className="rounded" />
                            <label htmlFor="is_trial" className="text-sm">This is a trial subscription</label>
                        </div>
                        <div>
                            <Label>Notes</Label>
                            <Input value={form.data.notes} onChange={e => form.setData('notes', e.target.value)} placeholder="Optional notes" />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                            <Button type="submit" disabled={form.processing}>{editSub ? 'Save Changes' : 'Assign'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Record Payment Modal */}
            <Dialog open={!!paySub} onOpenChange={open => !open && setPaySub(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Record Payment — {paySub?.school.name}</DialogTitle></DialogHeader>
                    <div className="mb-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm">
                        <p>Price: <strong>Le {paySub ? Number(paySub.price_per_term).toLocaleString() : 0}</strong></p>
                        <p>Balance: <strong className="text-amber-600">Le {paySub?.balance.toLocaleString()}</strong></p>
                    </div>

                    <Tabs defaultValue="online">
                        <TabsList className="w-full">
                            <TabsTrigger value="online" className="flex-1 gap-1"><Smartphone className="w-3.5 h-3.5" /> Online</TabsTrigger>
                            <TabsTrigger value="offline" className="flex-1 gap-1"><CreditCard className="w-3.5 h-3.5" /> Offline</TabsTrigger>
                        </TabsList>
                        <TabsContent value="online">
                            <form onSubmit={submitOnlinePayment} className="space-y-3 mt-3">
                                <div>
                                    <Label>Payment Method *</Label>
                                    <Select value={onlinePaymentForm.data.method} onValueChange={v => onlinePaymentForm.setData('method', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="orange_money">Orange Money</SelectItem>
                                            <SelectItem value="monime">Monime (MoMo / Card / Bank)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Phone Number *</Label>
                                    <Input placeholder="+23279630777" value={onlinePaymentForm.data.phone} onChange={e => onlinePaymentForm.setData('phone', e.target.value)} />
                                    {onlinePaymentForm.errors.phone && <p className="text-xs text-red-500 mt-1">{onlinePaymentForm.errors.phone}</p>}
                                </div>
                                <p className="text-xs text-slate-500">
                                    {onlinePaymentForm.data.method === 'orange_money'
                                        ? 'You will be redirected to Orange Money to complete payment.'
                                        : 'You will be redirected to Monime checkout (mobile money, card or bank transfer).'}
                                </p>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setPaySub(null)}>Cancel</Button>
                                    <Button type="submit" disabled={onlinePaymentForm.processing}
                                        className={onlinePaymentForm.data.method === 'orange_money' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-indigo-600 hover:bg-indigo-700'}>
                                        <Smartphone className="w-4 h-4 mr-1" />
                                        {onlinePaymentForm.data.method === 'orange_money' ? 'Pay via Orange Money' : 'Pay via Monime'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </TabsContent>
                        <TabsContent value="offline">
                            <form onSubmit={submitOfflinePayment} className="space-y-3 mt-3">
                                <div>
                                    <Label>Amount (Le) *</Label>
                                    <Input type="number" step="0.01" value={offlinePaymentForm.data.amount} onChange={e => offlinePaymentForm.setData('amount', e.target.value)} />
                                    {offlinePaymentForm.errors.amount && <p className="text-xs text-red-500 mt-1">{offlinePaymentForm.errors.amount}</p>}
                                </div>
                                <div>
                                    <Label>Method *</Label>
                                    <Select value={offlinePaymentForm.data.method} onValueChange={v => offlinePaymentForm.setData('method', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="orange_money">Orange Money</SelectItem>
                                            <SelectItem value="monime">Monime</SelectItem>
                                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                            <SelectItem value="cash">Cash</SelectItem>
                                            <SelectItem value="mobile_money">Mobile Money</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Notes</Label>
                                    <Input value={offlinePaymentForm.data.notes} onChange={e => offlinePaymentForm.setData('notes', e.target.value)} placeholder="Transaction reference, receipt no..." />
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setPaySub(null)}>Cancel</Button>
                                    <Button type="submit" disabled={offlinePaymentForm.processing}>Record Payment</Button>
                                </DialogFooter>
                            </form>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>

            {/* Payment History Modal */}
            <Dialog open={!!viewPayments} onOpenChange={open => !open && setViewPayments(null)}>
                <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Payment History — {viewPayments?.school.name}</DialogTitle></DialogHeader>
                    {viewPayments && (
                        <div>
                            <div className="mb-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm">
                                <p>Package: <strong>{viewPayments.package.name}</strong></p>
                                <p>Price per term: <strong>Le {Number(viewPayments.price_per_term).toLocaleString()}</strong></p>
                                <p>Balance: <strong className={viewPayments.balance > 0 ? 'text-amber-600' : 'text-green-600'}>Le {viewPayments.balance.toLocaleString()}</strong></p>
                            </div>
                            {viewPayments.confirmed_payments.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-4">No payments recorded yet.</p>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-xs uppercase text-slate-500">
                                            <th className="text-left py-2 font-medium">Date</th>
                                            <th className="text-left py-2 font-medium">Method</th>
                                            <th className="text-right py-2 font-medium">Amount</th>
                                            <th className="text-left py-2 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {viewPayments.confirmed_payments.map(p => (
                                            <tr key={p.id} className="border-b border-slate-100 dark:border-slate-700">
                                                <td className="py-2">{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '—'}</td>
                                                <td className="py-2 capitalize">{p.method.replace('_', ' ')}</td>
                                                <td className="py-2 text-right">Le {Number(p.amount).toLocaleString()}</td>
                                                <td className="py-2">
                                                    <span className={`text-xs px-1.5 py-0.5 rounded ${p.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {p.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirm */}
            <Dialog open={!!delSub} onOpenChange={open => !open && setDelSub(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Remove Subscription</DialogTitle></DialogHeader>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Remove subscription for <strong>{delSub?.school.name}</strong>?</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDelSub(null)}>Cancel</Button>
                        <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDelete}>Remove</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
