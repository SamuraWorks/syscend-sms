import AppLayout from '@/Layouts/AppLayout';
import { useForm, router } from '@inertiajs/react';
import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
    Fingerprint, FileText, Phone, Users, GraduationCap, Palette, Globe,
    Save, Upload, Trash2, CheckCircle, Eye, EyeOff,
    FileImage, Plus, Copy, Loader2, Brain, Sparkles, Check,
} from 'lucide-react';

interface SchoolData {
    [key: string]: any;
    name: string; short_name: string | null; motto: string | null;
    logo: string | null; badge: string | null; banner: string | null;
    primary_color: string | null; secondary_color: string | null;
    year_established: string | null; school_level: string | null;
    school_type: string | null; ownership: string | null;
    logo_url: string | null; badge_url: string | null; banner_url: string | null;
    signature_url: string | null; stamp_url: string | null;
    mbsse_registration_number: string | null; emis_code: string | null;
    waec_centre_number: string | null; npse_centre_number: string | null;
    bece_centre_number: string | null; wassce_centre_number: string | null;
    business_registration_number: string | null; tax_identification_number: string | null;
    email: string | null; phone: string | null; whatsapp_number: string | null;
    address: string | null; district_name: string | null; chiefdom: string | null;
    province: string | null; postal_address: string | null; website: string | null;
    gps_latitude: number | null; gps_longitude: number | null;
    proprietor_name: string | null; proprietor_photo: string | null;
    principal_name: string | null; principal_photo: string | null;
    vice_principal_name: string | null; bursar_name: string | null; registrar_name: string | null;
    working_days: string | null; school_opening_time: string | null; school_closing_time: string | null;
    ca_weight: string | null; exam_weight: string | null;
    official_signature: string | null; official_stamp: string | null;
    public_profile_enabled: boolean; about_school: string | null;
    school_mission: string | null; school_vision: string | null;
}

interface Props { school: SchoolData; settings: Record<string, string>; templates: ReportCardTemplateRow[]; }

const TABS = [
    { id: 'basic',        label: 'Basic Identity',     icon: Fingerprint },
    { id: 'registration', label: 'Registration',        icon: FileText },
    { id: 'contact',      label: 'Contact Info',        icon: Phone },
    { id: 'leadership',   label: 'Leadership',          icon: Users },
    { id: 'academic',     label: 'Academic Config',     icon: GraduationCap },
    { id: 'branding',     label: 'Branding Assets',     icon: Palette },
    { id: 'documents',    label: 'Official Documents',  icon: FileImage },
    { id: 'public',       label: 'Public Profile',      icon: Globe },
] as const;
type TabId = typeof TABS[number]['id'];

const SCHOOL_LEVELS = [
    { value: 'nursery', label: 'Nursery' },
    { value: 'primary', label: 'Primary' },
    { value: 'junior_secondary', label: 'Junior Secondary' },
    { value: 'senior_secondary', label: 'Senior Secondary' },
    { value: 'combined', label: 'Combined School' },
];
const SCHOOL_TYPES = [
    { value: 'government', label: 'Government' },
    { value: 'government_assisted', label: 'Government-Assisted' },
    { value: 'private', label: 'Private' },
    { value: 'community', label: 'Community' },
    { value: 'faith_based', label: 'Faith-Based' },
];
const PROVINCES = ['Northern', 'Southern', 'Eastern', 'Western Area'];

function SuccessBanner({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 dark:bg-green-950/30 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2">
            <CheckCircle className="w-4 h-4 shrink-0" /> {message}
        </div>
    );
}

function AssetPreview({ url, label, onRemove }: { url: string | null; label: string; onRemove?: () => void }) {
    return (
        <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-800">
                {url ? <img src={url} alt={label} className="w-full h-full object-contain p-1" /> : <span className="text-xs text-slate-400 text-center px-2">No {label}</span>}
            </div>
            {onRemove && url && (
                <Button type="button" variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={onRemove}>
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                </Button>
            )}
        </div>
    );
}

function FileUpload({ label, accept, description, currentUrl, onFile, onRemove }: {
    label: string; accept?: string; description: string; currentUrl: string | null;
    onFile: (f: File) => void; onRemove?: () => void;
}) {
    const ref = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(currentUrl);
    return (
        <div>
            <Label className="block mb-2">{label}</Label>
            <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-800 shrink-0">
                    {preview ? <img src={preview} alt={label} className="w-full h-full object-contain p-1" /> : <span className="text-[10px] text-slate-400 text-center px-1">{label}</span>}
                </div>
                <div>
                    <input ref={ref} type="file" accept={accept ?? 'image/*'} className="hidden" onChange={e => {
                        const f = e.target.files?.[0]; if (f) { onFile(f); setPreview(URL.createObjectURL(f)); }
                    }} />
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => ref.current?.click()}>
                        <Upload className="w-3.5 h-3.5" /> Upload
                    </Button>
                    <p className="text-xs text-slate-400 mt-1">{description}</p>
                    {preview && onRemove && (
                        <Button type="button" variant="ghost" size="sm" className="text-red-500 mt-1 h-6 px-2" onClick={() => { onRemove(); setPreview(null); }}>
                            <Trash2 className="w-3 h-3 mr-1" /> Remove
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ═══════════════ Basic Identity Tab ═══════════════ */
function BasicTab({ school }: { school: SchoolData }) {
    const form = useForm({
        short_name: school.short_name ?? '', motto: school.motto ?? '',
        secondary_color: school.secondary_color ?? '#6c757d',
        year_established: school.year_established ?? '', school_level: school.school_level ?? '',
        school_type: school.school_type ?? '', ownership: school.ownership ?? '',
    });

    return (
        <form onSubmit={e => { e.preventDefault(); form.post('/school/school-identity/basic'); }}>
            <Card>
                <CardHeader><CardTitle className="text-base">Basic School Identity</CardTitle><CardDescription>Motto, type, level, and ownership. School name and primary color are managed in Settings.</CardDescription></CardHeader>
                <CardContent className="space-y-5">
                    {form.recentlySuccessful && <SuccessBanner message="Identity updated." />}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><Label>Short Name / Abbreviation</Label><Input value={form.data.short_name} onChange={e => form.setData('short_name', e.target.value)} placeholder="e.g. SCS" /></div>
                        <div><Label>School Motto</Label><Input value={form.data.motto} onChange={e => form.setData('motto', e.target.value)} placeholder="e.g. Knowledge is Power" /></div>
                        <div><Label>School Type</Label><Select value={form.data.school_type} onValueChange={v => form.setData('school_type', v)}><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent>{SCHOOL_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
                        <div><Label>School Level</Label><Select value={form.data.school_level} onValueChange={v => form.setData('school_level', v)}><SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger><SelectContent>{SCHOOL_LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent></Select></div>
                        <div><Label>Year Established</Label><Input type="number" min="1800" max={new Date().getFullYear()} value={form.data.year_established} onChange={e => form.setData('year_established', e.target.value)} placeholder="e.g. 1995" /></div>
                        <div><Label>Ownership</Label><Input value={form.data.ownership} onChange={e => form.setData('ownership', e.target.value)} placeholder="e.g. Community Trust" /></div>
                    </div>
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Secondary Color</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><Label>Secondary Color</Label><div className="flex items-center gap-2"><input type="color" value={form.data.secondary_color} onChange={e => form.setData('secondary_color', e.target.value)} className="w-10 h-10 rounded border border-slate-200 cursor-pointer p-0.5" /><Input value={form.data.secondary_color} onChange={e => form.setData('secondary_color', e.target.value)} className="font-mono" /></div></div>
                        </div>
                    </div>
                    <div className="flex justify-end"><Button type="submit" disabled={form.processing} className="gap-2"><Save className="w-4 h-4" /> Save Identity</Button></div>
                </CardContent>
            </Card>
        </form>
    );
}

/* ═══════════════ Registration Tab ═══════════════ */
function RegistrationTab({ school }: { school: SchoolData }) {
    const form = useForm({
        mbsse_registration_number: school.mbsse_registration_number ?? '',
        emis_code: school.emis_code ?? '',
        waec_centre_number: school.waec_centre_number ?? '',
        npse_centre_number: school.npse_centre_number ?? '',
        bece_centre_number: school.bece_centre_number ?? '',
        wassce_centre_number: school.wassce_centre_number ?? '',
        business_registration_number: school.business_registration_number ?? '',
        tax_identification_number: school.tax_identification_number ?? '',
    });

    return (
        <form onSubmit={e => { e.preventDefault(); form.post('/school/school-identity/registration'); }}>
            <Card>
                <CardHeader><CardTitle className="text-base">Registration & Official Information</CardTitle><CardDescription>Ministry, examination centre, and business registration numbers.</CardDescription></CardHeader>
                <CardContent className="space-y-5">
                    {form.recentlySuccessful && <SuccessBanner message="Registration details updated." />}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><Label>MBSSE Registration Number</Label><Input value={form.data.mbsse_registration_number} onChange={e => form.setData('mbsse_registration_number', e.target.value)} placeholder="Ministry registration #" /></div>
                        <div><Label>EMIS / National School Code</Label><Input value={form.data.emis_code} onChange={e => form.setData('emis_code', e.target.value)} placeholder="EMIS code" /></div>
                        <div><Label>WAEC Centre Number</Label><Input value={form.data.waec_centre_number} onChange={e => form.setData('waec_centre_number', e.target.value)} placeholder="WAEC centre #" /></div>
                        <div><Label>NPSE Centre Number</Label><Input value={form.data.npse_centre_number} onChange={e => form.setData('npse_centre_number', e.target.value)} placeholder="NPSE centre #" /></div>
                        <div><Label>BECE Centre Number</Label><Input value={form.data.bece_centre_number} onChange={e => form.setData('bece_centre_number', e.target.value)} placeholder="BECE centre #" /></div>
                        <div><Label>WASSCE Centre Number</Label><Input value={form.data.wassce_centre_number} onChange={e => form.setData('wassce_centre_number', e.target.value)} placeholder="WASSCE centre #" /></div>
                        <div><Label>Business Registration Number</Label><Input value={form.data.business_registration_number} onChange={e => form.setData('business_registration_number', e.target.value)} placeholder="Optional" /></div>
                        <div><Label>Tax Identification Number</Label><Input value={form.data.tax_identification_number} onChange={e => form.setData('tax_identification_number', e.target.value)} placeholder="Optional" /></div>
                    </div>
                    <div className="flex justify-end"><Button type="submit" disabled={form.processing} className="gap-2"><Save className="w-4 h-4" /> Save Registration</Button></div>
                </CardContent>
            </Card>
        </form>
    );
}

/* ═══════════════ Contact Tab ═══════════════ */
function ContactTab({ school }: { school: SchoolData }) {
    const form = useForm({
        whatsapp_number: school.whatsapp_number ?? '',
        district_name: school.district_name ?? '',
        chiefdom: school.chiefdom ?? '', province: school.province ?? '',
        postal_address: school.postal_address ?? '', website: school.website ?? '',
        gps_latitude: school.gps_latitude ?? '', gps_longitude: school.gps_longitude ?? '',
    });

    return (
        <form onSubmit={e => { e.preventDefault(); form.post('/school/school-identity/contact'); }}>
            <Card>
                <CardHeader><CardTitle className="text-base">Location & Details</CardTitle><CardDescription>District, chiefdom, GPS coordinates, and website. Core contact (email, phone, address) is in Settings.</CardDescription></CardHeader>
                <CardContent className="space-y-5">
                    {form.recentlySuccessful && <SuccessBanner message="Contact info updated." />}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><Label>WhatsApp Number</Label><Input value={form.data.whatsapp_number} onChange={e => form.setData('whatsapp_number', e.target.value)} /></div>
                        <div><Label>Website</Label><Input value={form.data.website} onChange={e => form.setData('website', e.target.value)} placeholder="https://..." /></div>
                        <div><Label>District</Label><Input value={form.data.district_name} onChange={e => form.setData('district_name', e.target.value)} /></div>
                        <div><Label>Chiefdom / City / Town</Label><Input value={form.data.chiefdom} onChange={e => form.setData('chiefdom', e.target.value)} /></div>
                        <div><Label>Province / Region</Label><Select value={form.data.province} onValueChange={v => form.setData('province', v)}><SelectTrigger><SelectValue placeholder="Select province" /></SelectTrigger><SelectContent>{PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
                        <div><Label>Postal Address</Label><Input value={form.data.postal_address} onChange={e => form.setData('postal_address', e.target.value)} placeholder="Optional" /></div>
                        <div><Label>GPS Latitude</Label><Input type="number" step="any" value={form.data.gps_latitude} onChange={e => form.setData('gps_latitude', e.target.value)} placeholder="-8.484..." /></div>
                        <div><Label>GPS Longitude</Label><Input type="number" step="any" value={form.data.gps_longitude} onChange={e => form.setData('gps_longitude', e.target.value)} placeholder="11.310..." /></div>
                    </div>
                    <div className="flex justify-end"><Button type="submit" disabled={form.processing} className="gap-2"><Save className="w-4 h-4" /> Save Contact</Button></div>
                </CardContent>
            </Card>
        </form>
    );
}

/* ═══════════════ Leadership Tab ═══════════════ */
function LeadershipTab({ school }: { school: SchoolData }) {
    const form = useForm<{
        proprietor_name: string; proprietor_photo: File | null;
        principal_name: string; principal_photo: File | null;
        vice_principal_name: string; bursar_name: string; registrar_name: string;
    }>({
        proprietor_name: school.proprietor_name ?? '', proprietor_photo: null,
        principal_name: school.principal_name ?? '', principal_photo: null,
        vice_principal_name: school.vice_principal_name ?? '',
        bursar_name: school.bursar_name ?? '', registrar_name: school.registrar_name ?? '',
    });

    return (
        <form onSubmit={e => { e.preventDefault(); form.post('/school/school-identity/leadership', { forceFormData: true }); }}>
            <Card>
                <CardHeader><CardTitle className="text-base">Leadership Information</CardTitle><CardDescription>School leadership names and profile photos.</CardDescription></CardHeader>
                <CardContent className="space-y-6">
                    {form.recentlySuccessful && <SuccessBanner message="Leadership info updated." />}
                    {/* Proprietor */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Proprietor / Proprietress</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><Label>Full Name</Label><Input value={form.data.proprietor_name} onChange={e => form.setData('proprietor_name', e.target.value)} /></div>
                            <div>
                                <Label>Profile Photo</Label>
                                <input type="file" accept="image/*" className="hidden" id="proprietor-photo" onChange={e => form.setData('proprietor_photo', e.target.files?.[0] ?? null)} />
                                <div className="flex items-center gap-3 mt-1">
                                    {school.proprietor_photo && <img src={`/storage/${school.proprietor_photo}`} alt="" className="w-10 h-10 rounded-full object-cover" />}
                                    <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('proprietor-photo')?.click()}>Upload Photo</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Principal / Headteacher</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><Label>Full Name</Label><Input value={form.data.principal_name} onChange={e => form.setData('principal_name', e.target.value)} /></div>
                            <div>
                                <Label>Profile Photo</Label>
                                <input type="file" accept="image/*" className="hidden" id="principal-photo" onChange={e => form.setData('principal_photo', e.target.files?.[0] ?? null)} />
                                <div className="flex items-center gap-3 mt-1">
                                    {school.principal_photo && <img src={`/storage/${school.principal_photo}`} alt="" className="w-10 h-10 rounded-full object-cover" />}
                                    <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('principal-photo')?.click()}>Upload Photo</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div><Label>Vice Principal(s)</Label><Input value={form.data.vice_principal_name} onChange={e => form.setData('vice_principal_name', e.target.value)} /></div>
                            <div><Label>Bursar / Accountant</Label><Input value={form.data.bursar_name} onChange={e => form.setData('bursar_name', e.target.value)} /></div>
                            <div><Label>Registrar</Label><Input value={form.data.registrar_name} onChange={e => form.setData('registrar_name', e.target.value)} /></div>
                        </div>
                    </div>
                    <div className="flex justify-end"><Button type="submit" disabled={form.processing} className="gap-2"><Save className="w-4 h-4" /> Save Leadership</Button></div>
                </CardContent>
            </Card>
        </form>
    );
}

/* ═══════════════ Academic Tab ═══════════════ */
function AcademicTab({ school }: { school: SchoolData }) {
    const form = useForm({
        working_days: school.working_days ?? 'Monday-Friday',
        school_opening_time: school.school_opening_time ?? '08:00',
        school_closing_time: school.school_closing_time ?? '15:30',
    });

    return (
        <form onSubmit={e => { e.preventDefault(); form.post('/school/school-identity/academic'); }}>
            <Card>
                <CardHeader><CardTitle className="text-base">School Hours</CardTitle><CardDescription>Working days and school hours. CA/exam weights are in Sierra Leone Settings.</CardDescription></CardHeader>
                <CardContent className="space-y-5">
                    {form.recentlySuccessful && <SuccessBanner message="Academic config updated." />}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2"><Label>Working Days</Label><Input value={form.data.working_days} onChange={e => form.setData('working_days', e.target.value)} placeholder="e.g. Monday-Friday" /></div>
                        <div><Label>School Opening Time</Label><Input type="time" value={form.data.school_opening_time} onChange={e => form.setData('school_opening_time', e.target.value)} /></div>
                        <div><Label>School Closing Time</Label><Input type="time" value={form.data.school_closing_time} onChange={e => form.setData('school_closing_time', e.target.value)} /></div>
                    </div>
                    <div className="flex justify-end"><Button type="submit" disabled={form.processing} className="gap-2"><Save className="w-4 h-4" /> Save Academic Config</Button></div>
                </CardContent>
            </Card>
        </form>
    );
}

/* ═══════════════ Branding Tab ═══════════════ */
function BrandingTab({ school }: { school: SchoolData }) {
    const form = useForm<{
        badge: File | null; banner: File | null;
        official_signature: File | null; official_stamp: File | null;
    }>({ badge: null, banner: null, official_signature: null, official_stamp: null });

    const uploadField = (field: string, file: File) => {
        form.setData(field as any, file);
    };

    const removeAsset = (field: string) => {
        router.delete('/school/school-identity/asset', { data: { field }, preserveScroll: true });
    };

    return (
        <form onSubmit={e => { e.preventDefault(); form.post('/school/school-identity/branding', { forceFormData: true }); }}>
            <Card>
                <CardHeader><CardTitle className="text-base">Identity Assets</CardTitle><CardDescription>Badge, banner, signature, and stamp. Logo/favicon are in Settings.</CardDescription></CardHeader>
                <CardContent className="space-y-6">
                    {form.recentlySuccessful && <SuccessBanner message="Branding assets updated." />}
                    <FileUpload label="School Badge / Crest" currentUrl={school.badge_url} description="PNG/SVG, max 2MB." onFile={f => uploadField('badge', f)} onRemove={() => removeAsset('badge')} />
                    <FileUpload label="School Banner" currentUrl={school.banner_url} description="JPG/PNG, max 4MB. Recommended 1200x400px." onFile={f => uploadField('banner', f)} onRemove={() => removeAsset('banner')} />
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Official Marks</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <FileUpload label="Official Signature" currentUrl={school.signature_url} description="PNG with transparent bg, max 1MB." onFile={f => uploadField('official_signature', f)} onRemove={() => removeAsset('official_signature')} />
                            <FileUpload label="Official School Stamp" currentUrl={school.stamp_url} description="PNG with transparent bg, max 1MB." onFile={f => uploadField('official_stamp', f)} onRemove={() => removeAsset('official_stamp')} />
                        </div>
                    </div>
                    <div className="flex justify-end"><Button type="submit" disabled={form.processing} className="gap-2"><Save className="w-4 h-4" /> Save Branding</Button></div>
                </CardContent>
            </Card>
        </form>
    );
}

/* ═══════════════ Public Profile Tab ═══════════════ */
function PublicProfileTab({ school }: { school: SchoolData }) {
    const form = useForm({
        public_profile_enabled: school.public_profile_enabled ?? false,
        about_school: school.about_school ?? '',
        school_mission: school.school_mission ?? '',
        school_vision: school.school_vision ?? '',
    });

    return (
        <form onSubmit={e => { e.preventDefault(); form.post('/school/school-identity/public-profile'); }}>
            <Card>
                <CardHeader><CardTitle className="text-base">Public School Profile</CardTitle><CardDescription>Control what visitors see on your public-facing school profile page.</CardDescription></CardHeader>
                <CardContent className="space-y-5">
                    {form.recentlySuccessful && <SuccessBanner message="Public profile updated." />}
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                        <div>
                            <p className="text-sm font-medium">Enable Public Profile</p>
                            <p className="text-xs text-slate-500 mt-0.5">Allow anyone to view your school's public profile page.</p>
                        </div>
                        <Switch checked={form.data.public_profile_enabled} onCheckedChange={v => form.setData('public_profile_enabled', v)} />
                    </div>
                    <div><Label>About the School</Label><Textarea rows={4} value={form.data.about_school} onChange={e => form.setData('about_school', e.target.value)} placeholder="Brief description of your school..." /></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><Label>Mission Statement</Label><Textarea rows={3} value={form.data.school_mission} onChange={e => form.setData('school_mission', e.target.value)} placeholder="Our mission is to..." /></div>
                        <div><Label>Vision Statement</Label><Textarea rows={3} value={form.data.school_vision} onChange={e => form.setData('school_vision', e.target.value)} placeholder="Our vision is to..." /></div>
                    </div>
                    <div className="flex justify-end"><Button type="submit" disabled={form.processing} className="gap-2"><Save className="w-4 h-4" /> Save Public Profile</Button></div>
                </CardContent>
            </Card>
        </form>
    );
}

/* ═══════════════ Official Documents Tab ═══════════════ */

interface ReportCardTemplateRow {
    id: number; name: string; description: string | null; status: string; version: number;
    front_image_path: string | null; back_image_path: string | null;
    ai_analysis: Record<string, any> | null; template_config: Record<string, any> | null;
    ai_analyzed_at: string | null; activated_at: string | null;
    created_at: string; creator?: { name: string };
}

function OfficialDocumentsTab({ templates: initialTemplates }: { templates: ReportCardTemplateRow[] }) {
    const [templates, setTemplates] = useState<ReportCardTemplateRow[]>(initialTemplates);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [previewTemplate, setPreviewTemplate] = useState<ReportCardTemplateRow | null>(null);
    const [analyzingId, setAnalyzingId] = useState<number | null>(null);

    const createForm = useForm({ name: '', description: '', front_image: null as File | null, back_image: null as File | null });
    const fileRefFront = useRef<HTMLInputElement>(null);
    const fileRefBack = useRef<HTMLInputElement>(null);

    function refreshTemplates() {
        router.reload({ only: ['templates'] });
    }

    function submitCreate(e: React.FormEvent) {
        e.preventDefault();
        createForm.post('/school/report-card-templates', {
            forceFormData: true,
            onSuccess: () => { setShowCreateModal(false); createForm.reset(); refreshTemplates(); toast.success('Template created successfully.'); },
        });
    }

    function toggleStatus(t: ReportCardTemplateRow) {
        const action = t.status === 'active' ? 'archive' : 'approve';
        router.patch(`/school/report-card-templates/${t.id}/${action}`, {}, {
            onSuccess: () => { refreshTemplates(); toast.success(`Template ${action === 'approve' ? 'activated' : 'archived'}.`); },
        });
    }

    function duplicateTemplate(t: ReportCardTemplateRow) {
        router.post(`/school/report-card-templates/${t.id}/duplicate`, {}, {
            onSuccess: () => { refreshTemplates(); toast.success('Template duplicated.'); },
        });
    }

    function deleteTemplate(t: ReportCardTemplateRow) {
        if (!confirm(`Delete template "${t.name}"? This cannot be undone.`)) return;
        router.delete(`/school/report-card-templates/${t.id}`, {
            onSuccess: () => { refreshTemplates(); toast.success('Template deleted.'); },
        });
    }

    function analyzeWithAI(t: ReportCardTemplateRow) {
        setAnalyzingId(t.id);
        router.post(`/school/report-card-templates/${t.id}/analyze`, {}, {
            preserveScroll: true,
            onSuccess: () => { setAnalyzingId(null); refreshTemplates(); toast.success('AI analysis complete!'); },
            onError: () => { setAnalyzingId(null); toast.error('AI analysis failed.'); },
        });
    }

    function statusBadge(status: string) {
        const map: Record<string, string> = {
            active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            draft: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
            archived: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        };
        return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[status] ?? ''}`}>{status}</span>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-base">Official Document Templates</CardTitle>
                        <CardDescription>Build, manage, and activate report card templates for your school</CardDescription>
                    </div>
                    <Button onClick={() => setShowCreateModal(true)} className="gap-2" size="sm">
                        <Plus className="w-4 h-4" /> New Template
                    </Button>
                </CardHeader>
                <CardContent>
                    {templates.length === 0 ? (
                        <div className="text-center py-10">
                            <FileImage className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                            <p className="text-sm text-muted-foreground">No templates yet. Create one to get started.</p>
                            <p className="text-xs text-slate-400 mt-1">Upload a scanned report card and let AI analyze its layout.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {templates.map(t => (
                                <div key={t.id} className={cn('rounded-lg border p-4 space-y-3 transition-colors', t.status === 'active' ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-950/20' : 'border-border hover:border-primary/50')}>
                                    <div className="flex items-start justify-between">
                                        <div className="min-w-0">
                                            <h4 className="font-medium text-sm truncate">{t.name}</h4>
                                            <p className="text-xs text-muted-foreground mt-0.5">v{t.version} · {statusBadge(t.status)}</p>
                                        </div>
                                    </div>
                                    {t.description && <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>}
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        {t.front_image_path && <span className="flex items-center gap-1"><FileImage className="w-3 h-3" /> Front</span>}
                                        {t.back_image_path && <span className="flex items-center gap-1"><FileImage className="w-3 h-3" /> Back</span>}
                                        {t.ai_analyzed_at && <span className="flex items-center gap-1 text-green-600"><Brain className="w-3 h-3" /> AI Analyzed</span>}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setPreviewTemplate(t)}>
                                            <Eye className="w-3 h-3" /> View
                                        </Button>
                                        <Button size="sm" variant="outline" className={cn('h-7 text-xs gap-1', t.status === 'active' && 'text-orange-600 border-orange-300')} onClick={() => toggleStatus(t)}>
                                            {t.status === 'active' ? <><EyeOff className="w-3 h-3" /> Archive</> : <><Check className="w-3 h-3" /> Activate</>}
                                        </Button>
                                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => duplicateTemplate(t)}>
                                            <Copy className="w-3 h-3" /> Duplicate
                                        </Button>
                                        {!t.ai_analyzed_at && (
                                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-purple-600 border-purple-300" onClick={() => analyzeWithAI(t)} disabled={analyzingId === t.id}>
                                                {analyzingId === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Analyze
                                            </Button>
                                        )}
                                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-red-500 hover:text-red-700" onClick={() => deleteTemplate(t)}>
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Template Modal */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Create Report Card Template</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitCreate} className="space-y-4">
                        <div>
                            <Label>Template Name *</Label>
                            <Input value={createForm.data.name} onChange={e => createForm.setData('name', e.target.value)} placeholder="e.g. Standard Report Card 2025" />
                            {createForm.errors.name && <p className="text-xs text-red-500 mt-1">{createForm.errors.name}</p>}
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Textarea rows={2} value={createForm.data.description ?? ''} onChange={e => createForm.setData('description', e.target.value)} placeholder="Brief description..." />
                        </div>
                        <div>
                            <Label>Front Image *</Label>
                            <input ref={fileRefFront} type="file" accept="image/*,application/pdf" className="hidden" onChange={e => createForm.setData('front_image', e.target.files?.[0] ?? null)} />
                            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => fileRefFront.current?.click()}>
                                <Upload className="w-3.5 h-3.5" /> {createForm.data.front_image ? createForm.data.front_image.name : 'Choose file'}
                            </Button>
                            <p className="text-xs text-muted-foreground mt-1">JPG/PNG/PDF, max 10MB. This is the scanned report card image AI will analyze.</p>
                            {createForm.errors.front_image && <p className="text-xs text-red-500 mt-1">{createForm.errors.front_image}</p>}
                        </div>
                        <div>
                            <Label>Back Image (optional)</Label>
                            <input ref={fileRefBack} type="file" accept="image/*,application/pdf" className="hidden" onChange={e => createForm.setData('back_image', e.target.files?.[0] ?? null)} />
                            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => fileRefBack.current?.click()}>
                                <Upload className="w-3.5 h-3.5" /> {createForm.data.back_image ? createForm.data.back_image.name : 'Choose file'}
                            </Button>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                            <Button type="submit" disabled={createForm.processing || !createForm.data.front_image}>
                                {createForm.processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Create Template
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Preview Template Modal — side-by-side original vs AI analysis */}
            <Dialog open={!!previewTemplate} onOpenChange={open => !open && setPreviewTemplate(null)}>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {previewTemplate?.name}
                            {previewTemplate && statusBadge(previewTemplate.status)}
                        </DialogTitle>
                    </DialogHeader>
                    {previewTemplate && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Original Image</h4>
                                    <div className="rounded-lg border border-border bg-accent/30 p-2 min-h-[200px] flex items-center justify-center">
                                        {previewTemplate.front_image_path ? (
                                            <img src={`/storage/${previewTemplate.front_image_path}`} alt="Front" className="max-w-full max-h-[300px] object-contain rounded" />
                                        ) : (
                                            <span className="text-xs text-muted-foreground">No image</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">AI Analysis</h4>
                                    <div className="rounded-lg border border-border bg-accent/30 p-3 min-h-[200px]">
                                        {previewTemplate.ai_analysis ? (
                                            <div className="space-y-2 text-xs">
                                                {Object.entries(previewTemplate.ai_analysis).map(([key, val]) => (
                                                    <div key={key}>
                                                        <span className="font-medium text-muted-foreground">{key.replace(/_/g, ' ')}:</span>
                                                        <span className="ml-2 text-foreground">
                                                            {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <Brain className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                                                <p className="text-xs text-muted-foreground">Not yet analyzed. Click "Analyze" to run AI analysis.</p>
                                                <Button size="sm" variant="outline" className="mt-2 gap-1 text-purple-600 border-purple-300" onClick={() => { setPreviewTemplate(null); analyzeWithAI(previewTemplate); }}>
                                                    <Sparkles className="w-3 h-3" /> Analyze Now
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {previewTemplate.back_image_path && (
                                <div>
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Back Image</h4>
                                    <div className="rounded-lg border border-border bg-accent/30 p-2 flex items-center justify-center">
                                        <img src={`/storage/${previewTemplate.back_image_path}`} alt="Back" className="max-w-full max-h-[300px] object-contain rounded" />
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Version {previewTemplate.version}</span>
                                {previewTemplate.creator && <span>Created by {previewTemplate.creator.name}</span>}
                                <span>{new Date(previewTemplate.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

/* ═══════════════ Main Page ═══════════════ */
export default function SchoolIdentityIndex({ school, settings, templates }: Props) {
    const [activeTab, setActiveTab] = useState<TabId>('basic');

    return (
        <AppLayout title="School Identity">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">School Identity & Branding</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Manage your school's official identity, registration, and branding</p>
                </div>

                <div className="flex gap-6">
                    <nav className="w-48 shrink-0">
                        <ul className="space-y-0.5">
                            {TABS.map(t => (
                                <li key={t.id}>
                                    <button onClick={() => setActiveTab(t.id)} className={cn(
                                        'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left',
                                        activeTab === t.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                                    )}>
                                        <t.icon className="w-4 h-4 shrink-0" />
                                        {t.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div className="flex-1 min-w-0">
                        {activeTab === 'basic'        && <BasicTab school={school} />}
                        {activeTab === 'registration' && <RegistrationTab school={school} />}
                        {activeTab === 'contact'      && <ContactTab school={school} />}
                        {activeTab === 'leadership'   && <LeadershipTab school={school} />}
                        {activeTab === 'academic'     && <AcademicTab school={school} />}
                        {activeTab === 'branding'     && <BrandingTab school={school} />}
                        {activeTab === 'documents'    && <OfficialDocumentsTab templates={templates} />}
                        {activeTab === 'public'       && <PublicProfileTab school={school} />}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
