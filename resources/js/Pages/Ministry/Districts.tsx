import MinistryLayout from '@/Layouts/MinistryLayout';
import { useRealtime } from '@/lib/useRealtime';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, School, GraduationCap, UserCog } from 'lucide-react';

interface DistrictData {
    id: number;
    name: string;
    code: string;
    province: string;
    schools_count: number;
    students_count: number;
    national_students_count: number;
    teachers_count: number;
    national_teachers_count: number;
    education_officer?: { name: string };
}

interface Props {
    districts: DistrictData[];
}

const PROVINCE_COLORS: Record<string, string> = {
    'Western Area': 'bg-sky-50 text-sky-700 border-sky-200',
    'Northern Province': 'bg-amber-50 text-amber-700 border-amber-200',
    'Southern Province': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Eastern Province': 'bg-violet-50 text-violet-700 border-violet-200',
};

export default function MinistryDistricts({ districts }: Props) {
    const stats = {
        total: districts.length,
        totalSchools: districts.reduce((sum, d) => sum + d.schools_count, 0),
        totalStudents: districts.reduce((sum, d) => sum + d.national_students_count, 0),
        totalTeachers: districts.reduce((sum, d) => sum + d.national_teachers_count, 0),
    };

    const groupedByProvince = districts.reduce<Record<string, DistrictData[]>>((acc, d) => {
        (acc[d.province] ??= []).push(d);
        return acc;
    }, {});

    useRealtime();

    return (
        <MinistryLayout title="District Management">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                        <MapPin className="w-6 h-6 text-primary" />
                        District Management
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Education districts across Sierra Leone
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Districts', value: stats.total, icon: MapPin, color: 'text-primary' },
                        { label: 'Total Schools', value: stats.totalSchools, icon: School, color: 'text-emerald-600' },
                        { label: 'Total Students', value: stats.totalStudents.toLocaleString(), icon: GraduationCap, color: 'text-blue-600' },
                        { label: 'Total Teachers', value: stats.totalTeachers.toLocaleString(), icon: UserCog, color: 'text-violet-600' },
                    ].map((stat) => (
                        <Card key={stat.label}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                                        <stat.icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {Object.entries(groupedByProvince).map(([province, provDistricts]) => (
                    <div key={province} className="space-y-3">
                        <h2 className="text-lg font-serif font-semibold text-foreground flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            {province}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {provDistricts.map((district) => (
                                <Card key={district.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base font-serif">{district.name}</CardTitle>
                                            <Badge variant="outline" className={`text-xs ${PROVINCE_COLORS[province] ?? ''}`}>
                                                {district.code}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-center mt-2">
                                            <div className="p-2 rounded bg-muted/50">
                                                <p className="text-lg font-bold text-foreground">{district.schools_count}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">Schools</p>
                                            </div>
                                            <div className="p-2 rounded bg-muted/50">
                                                <p className="text-lg font-bold text-foreground">{district.national_students_count.toLocaleString()}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">Students</p>
                                            </div>
                                            <div className="p-2 rounded bg-muted/50">
                                                <p className="text-lg font-bold text-foreground">{district.national_teachers_count.toLocaleString()}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">Teachers</p>
                                            </div>
                                        </div>
                                        {district.education_officer && (
                                            <p className="text-xs text-muted-foreground mt-3">
                                                Officer: <span className="font-medium text-foreground">{district.education_officer.name}</span>
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </MinistryLayout>
    );
}
