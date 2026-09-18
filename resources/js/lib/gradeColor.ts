export function gradeColor(g: string | null | undefined): string {
    if (!g) return 'text-slate-400';
    const grade = g.toUpperCase().trim();
    // WAEC grades
    if (['A1', 'A+'].includes(grade)) return 'text-emerald-600 dark:text-emerald-400';
    if (['A', 'A-', 'B2', 'B3'].includes(grade)) return 'text-green-600 dark:text-green-400';
    if (['B', 'B-', 'C4', 'C5', 'C6'].includes(grade)) return 'text-blue-600 dark:text-blue-400';
    if (['C', 'C-', 'D7', 'E8'].includes(grade)) return 'text-amber-600 dark:text-amber-400';
    if (['D', 'D-', 'F9'].includes(grade)) return 'text-orange-600 dark:text-orange-400';
    if (['F', 'F-'].includes(grade)) return 'text-red-600 dark:text-red-400';
    // Percentage-based
    if (grade.includes('EXCELLENT') || grade.includes('OUTSTANDING')) return 'text-emerald-600 dark:text-emerald-400';
    if (grade.includes('VERY GOOD')) return 'text-green-600 dark:text-green-400';
    if (grade.includes('GOOD') || grade.includes('CREDIT')) return 'text-blue-600 dark:text-blue-400';
    if (grade.includes('SATISFACTORY') || grade.includes('PASS')) return 'text-amber-600 dark:text-amber-400';
    if (grade.includes('FAIL') || grade.includes('POOR')) return 'text-red-600 dark:text-red-400';
    return 'text-slate-600 dark:text-slate-400';
}
