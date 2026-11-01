import MinistryLayout from '@/Layouts/MinistryLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GraduationCap, UserCog } from 'lucide-react';

interface DistrictRow {
    id: number;
    name: string;
    national_students_count: number;
}

interface Props {
    studentsByGender: Record<string, number>;
    teachersByGender: Record<string, number>;
    genderByDistrict: DistrictRow[];
}

export default function ReportGender({ studentsByGender, teachersByGender, genderByDistrict }: Props) {
    const totalStudents = Object.values(studentsByGender).reduce((s, v) => s + v, 0);
    const totalTeachers = Object.values(teachersByGender).reduce((s, v) => s + v, 0);

    const studentEntries = Object.entries(studentsByGender).sort((a, b) => b[1] - a[1]);
    const teacherEntries = Object.entries(teachersByGender).sort((a, b) => b[1] - a[1]);

    return (
        <MinistryLayout title="Reports — Gender Analytics">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary" />
                        Gender Analytics
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Student and teacher gender distribution across the nation
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-serif flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-primary" />
                                Students by Gender
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="text-center mb-4">
                                    <p className="text-3xl font-bold text-foreground">{totalStudents.toLocaleString()}</p>
                                    <p className="text-sm text-muted-foreground">Total Students</p>
                                </div>
                                {studentEntries.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
                                ) : (
                                    <div className="space-y-3">
                                        {studentEntries.map(([gender, count]) => {
                                            const pct = totalStudents > 0 ? ((count / totalStudents) * 100).toFixed(1) : '0';
                                            return (
                                                <div key={gender} className="space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium text-foreground capitalize">{gender}</span>
                                                        <span className="text-sm text-muted-foreground">{count.toLocaleString()} ({pct}%)</span>
                                                    </div>
                                                    <div className="w-full bg-muted rounded-full h-3">
                                                        <div className="h-3 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-serif flex items-center gap-2">
                                <UserCog className="w-5 h-5 text-primary" />
                                Teachers by Gender
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="text-center mb-4">
                                    <p className="text-3xl font-bold text-foreground">{totalTeachers.toLocaleString()}</p>
                                    <p className="text-sm text-muted-foreground">Total Teachers</p>
                                </div>
                                {teacherEntries.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
                                ) : (
                                    <div className="space-y-3">
                                        {teacherEntries.map(([gender, count]) => {
                                            const pct = totalTeachers > 0 ? ((count / totalTeachers) * 100).toFixed(1) : '0';
                                            return (
                                                <div key={gender} className="space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium text-foreground capitalize">{gender}</span>
                                                        <span className="text-sm text-muted-foreground">{count.toLocaleString()} ({pct}%)</span>
                                                    </div>
                                                    <div className="w-full bg-muted rounded-full h-3">
                                                        <div className="h-3 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-serif">Students by District</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">#</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">District</th>
                                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Total Students</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {genderByDistrict.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="py-12 text-center text-muted-foreground">
                                                <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                                                <p>No district data available</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        genderByDistrict.map((d, i) => (
                                            <tr key={d.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                                <td className="py-3 px-4 text-muted-foreground">{i + 1}</td>
                                                <td className="py-3 px-4 font-medium text-foreground">{d.name}</td>
                                                <td className="py-3 px-4 text-right text-foreground">{d.national_students_count.toLocaleString()}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-border bg-accent/50">
                                        <td className="py-3 px-4 font-sans text-sm font-semibold text-foreground" colSpan={2}>
                                            National Total
                                        </td>
                                        <td className="py-3 px-4 text-right font-sans text-sm font-semibold text-foreground">
                                            {genderByDistrict.reduce((s, d) => s + d.national_students_count, 0).toLocaleString()}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MinistryLayout>
    );
}
