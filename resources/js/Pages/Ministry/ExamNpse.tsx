import Exams from './Exams';

interface Candidate {
    id: number;
    student_id: string;
    school_id: number;
    exam_type: string;
    exam_year: number;
    total_score: number;
    overall_grade: string;
    overall_result: string;
    status: string;
    school: { id: number; name: string };
}

interface Props {
    candidates: Candidate[];
    summary: { total: number; passed: number; failed: number };
}

export default function ExamNpse({ candidates, summary }: Props) {
    const avg_score = candidates.length > 0
        ? candidates.reduce((sum, c) => sum + c.total_score, 0) / candidates.length
        : 0;

    const pass_rate = summary.total > 0 ? (summary.passed / summary.total) * 100 : 0;

    const stats = {
        total_registered: candidates.length,
        total_sat: candidates.length,
        total_passed: summary.passed,
        pass_rate: Math.round(pass_rate * 10) / 10,
        avg_score: Math.round(avg_score * 10) / 10,
    };

    const schoolMap = new Map<number, { name: string; total: number; passed: number; scores: number[] }>();
    for (const c of candidates) {
        if (!schoolMap.has(c.school_id)) {
            schoolMap.set(c.school_id, { name: c.school.name, total: 0, passed: 0, scores: [] });
        }
        const entry = schoolMap.get(c.school_id)!;
        entry.total++;
        entry.scores.push(c.total_score);
        if (c.overall_result === 'pass') entry.passed++;
    }

    const topSchools = Array.from(schoolMap.values())
        .map((s) => ({
            name: s.name,
            pass_rate: Math.round((s.passed / s.total) * 1000) / 10,
            avg_score: Math.round((s.scores.reduce((a, b) => a + b, 0) / s.scores.length) * 10) / 10,
        }))
        .sort((a, b) => b.pass_rate - a.pass_rate)
        .slice(0, 10);

    return <Exams examType="npse" stats={stats} topSchools={topSchools} />;
}
