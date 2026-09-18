import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface School { id: number; name: string; }
interface Department { id: number; name: string; code: string; }
interface PageProps {
    school: School;
    settings: Record<string, string>;
    levels: string[];
    departments: Department[];
    examTypes: Record<string, { label: string; short_label: string }>;
}

export default function SierraLeoneSettings({ school, settings, levels, departments, examTypes }: PageProps) {
    const eduForm = useForm({
        country_code: settings.country_code || 'SL',
        education_system: settings.education_system || '6-3-3-4',
        terms_per_year: settings.terms_per_year || '3',
        ca_weight: settings.ca_weight || '40',
        exam_weight: settings.exam_weight || '60',
        grading_system: settings.grading_system || 'wassce',
        pass_mark: settings.pass_mark || '50',
        section_format: settings.section_format || 'letter',
        national_exam_npse: settings.national_exam_npse === '1',
        national_exam_bece: settings.national_exam_bece === '1',
        national_exam_wassce: settings.national_exam_wassce === '1',
    });

    const levelForm = useForm({
        enabled_levels: levels.filter(l => settings[`enable_${l}`] !== '0'),
    });

    const handleEduSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        eduForm.post('/school/settings/sierra-leone/education', {
            onSuccess: () => toast.success('Education system settings saved.'),
        });
    };

    const handleLevelSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        levelForm.post('/school/settings/sierra-leone/levels', {
            onSuccess: () => toast.success('School levels updated.'),
        });
    };

    const toggleLevel = (level: string) => {
        const current = levelForm.data.enabled_levels;
        levelForm.setData('enabled_levels',
            current.includes(level) ? current.filter(l => l !== level) : [...current, level]
        );
    };

    return (
        <AppLayout title="Sierra Leone Settings">
            <Head title="Sierra Leone Settings" />
            <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Education System</CardTitle>
                        <CardDescription>Configure the national education structure, grading, and examination settings for {school.name}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleEduSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label>Country Code</Label>
                                    <Input value={eduForm.data.country_code} onChange={e => eduForm.setData('country_code', e.target.value)} />
                                </div>
                                <div>
                                    <Label>Education System</Label>
                                    <Select value={eduForm.data.education_system} onValueChange={v => eduForm.setData('education_system', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="6-3-3-4">6-3-3-4 (Primary-JSS-SSS)</SelectItem>
                                            <SelectItem value="6-3-4">6-3-4 (Primary-JSS-SSS)</SelectItem>
                                            <SelectItem value="6-6">6-6 (Primary-Secondary)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Terms Per Year</Label>
                                    <Select value={eduForm.data.terms_per_year} onValueChange={v => eduForm.setData('terms_per_year', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="2">2 Terms</SelectItem>
                                            <SelectItem value="3">3 Terms</SelectItem>
                                            <SelectItem value="4">4 Terms</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Section Format</Label>
                                    <Select value={eduForm.data.section_format} onValueChange={v => eduForm.setData('section_format', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="letter">Letter (A, B, C)</SelectItem>
                                            <SelectItem value="number">Number (1, 2, 3)</SelectItem>
                                            <SelectItem value="custom">Custom</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label>Grading System</Label>
                                    <Select value={eduForm.data.grading_system} onValueChange={v => eduForm.setData('grading_system', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="wassce">WASSCE (A1-F9)</SelectItem>
                                            <SelectItem value="npse">NPSE (A-F)</SelectItem>
                                            <SelectItem value="percentage">Percentage</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Pass Mark (%)</Label>
                                    <Input type="number" min="0" max="100" value={eduForm.data.pass_mark} onChange={e => eduForm.setData('pass_mark', e.target.value)} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label>CA Weight (%)</Label>
                                    <Input type="number" min="0" max="100" value={eduForm.data.ca_weight} onChange={e => eduForm.setData('ca_weight', e.target.value)} />
                                </div>
                                <div>
                                    <Label>Exam Weight (%)</Label>
                                    <Input type="number" min="0" max="100" value={eduForm.data.exam_weight} onChange={e => eduForm.setData('exam_weight', e.target.value)} />
                                </div>
                            </div>

                            <div>
                                <Label className="mb-2 block">National Examinations</Label>
                                <div className="flex gap-6">
                                    {Object.entries(examTypes).map(([key, exam]) => (
                                        <label key={key} className="flex items-center gap-2 text-sm">
                                            <Checkbox
                                                checked={eduForm.data[`national_exam_${key}` as keyof typeof eduForm.data] as boolean}
                                                onCheckedChange={(checked) => eduForm.setData(`national_exam_${key}` as any, !!checked)}
                                            />
                                            {exam.short_label}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <Button type="submit" disabled={eduForm.processing}>Save Education Settings</Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>School Levels</CardTitle>
                        <CardDescription>Select which education levels your school offers</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLevelSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {levels.map(level => (
                                    <label key={level} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                                        <Checkbox
                                            checked={levelForm.data.enabled_levels.includes(level)}
                                            onCheckedChange={() => toggleLevel(level)}
                                        />
                                        <span className="text-sm font-medium">
                                            {level.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                        </span>
                                    </label>
                                ))}
                            </div>
                            <Button type="submit" disabled={levelForm.processing}>Save School Levels</Button>
                        </form>
                    </CardContent>
                </Card>

                {departments.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Academic Departments</CardTitle>
                            <CardDescription>Departments configured for your school</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {departments.map(d => (
                                    <div key={d.id} className="p-2 border rounded text-sm">
                                        {d.name} ({d.code})
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
