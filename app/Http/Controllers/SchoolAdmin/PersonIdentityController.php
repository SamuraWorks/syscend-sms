<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\School;
use App\Models\SchoolSetting;
use App\Models\Staff;
use App\Models\Student;
use App\Services\SchoolPersonIdService;
use Illuminate\Http\Request;

/**
 * School-owned identity system.
 *
 * The school is the authority for its people's identifiers:
 *  - supplied IDs (student_id / emp_id) are preserved, never replaced;
 *  - optional, configurable ID generation lives behind an explicit switch;
 *  - changing a visible school ID never alters the underlying record identity
 *    and is always audited.
 */
class PersonIdentityController extends Controller
{
    private const PERSON_TYPES = [
        'student' => ['model' => Student::class, 'field' => 'student_id', 'label' => 'Student ID'],
        'staff'   => ['model' => Staff::class,   'field' => 'emp_id',     'label' => 'Staff ID'],
        'teacher' => ['model' => Staff::class,   'field' => 'emp_id',     'label' => 'Teacher ID'],
    ];

    public function settings(Request $request)
    {
        $schoolId = $this->getSchoolId();

        return response()->json([
            'enabled'     => SchoolPersonIdService::generationEnabled($schoolId),
            'preview'     => [
                'student' => SchoolPersonIdService::nextPreview($schoolId, 'student'),
                'teacher' => SchoolPersonIdService::nextPreview($schoolId, 'teacher'),
                'staff'   => SchoolPersonIdService::nextPreview($schoolId, 'staff'),
            ],
            'formats'     => [
                'student' => SchoolSetting::get($schoolId, 'student_id_format'),
                'teacher' => SchoolSetting::get($schoolId, 'teacher_id_format'),
                'staff'   => SchoolSetting::get($schoolId, 'staff_id_format'),
            ],
            'default_formats' => SchoolPersonIdService::DEFAULT_FORMATS,
            'tokens'      => [
                '{SCHOOL}' => 'School code',
                '{TYPE}'   => 'Person type (STU / TCH / STF)',
                '{YYYY}'   => 'Four-digit year',
                '{YY}'     => 'Two-digit year',
                '{SEQ:N}'  => 'Per-school sequence, padded to N digits',
            ],
        ]);
    }

    public function saveSettings(Request $request)
    {
        $schoolId = $this->getSchoolId();

        $validated = $request->validate([
            'enabled'           => 'required|boolean',
            'formats.student'   => ['nullable', 'string', 'max:120', $this->formatTokenRule()],
            'formats.teacher'   => ['nullable', 'string', 'max:120', $this->formatTokenRule()],
            'formats.staff'     => ['nullable', 'string', 'max:120', $this->formatTokenRule()],
        ]);

        SchoolPersonIdService::setGenerationEnabled($schoolId, (bool) $validated['enabled']);

        foreach (($validated['formats'] ?? []) as $type => $format) {
            $trimmed = trim((string) $format);
            SchoolSetting::set($schoolId, SchoolPersonIdService::TYPE_SETTINGS[$type], $trimmed);
        }

        return $this->settings($request)->setStatusCode(200);
    }

    /**
     * Update a person's school-issued ID. Internal record identity is unchanged.
     */
    public function updatePersonId(Request $request, string $personType, int $personId)
    {
        $type = self::PERSON_TYPES[$personType] ?? null;

        if (! $type) {
            return response()->json(['error' => 'Unknown person type.'], 422);
        }

        $schoolId = $this->getSchoolId();

        $validated = $request->validate([
            'school_id' => ['nullable', 'string', 'max:100'],
        ]);

        $id = $validated['school_id'] !== null ? trim($validated['school_id']) : null;
        $id = $id === '' ? null : $id;

        /** @var \App\Models\Model $model */
        $model = $type['model'];
        $record = $model::query()->where('school_id', $schoolId)->find($personId);

        if (! $record) {
            return response()->json(['error' => 'Record not found in this school.'], 404);
        }

        if ($id !== null) {
            $collision = $model::query()
                ->where('school_id', $schoolId)
                ->where($type['field'], $id)
                ->where('id', '!=', $personId)
                ->exists();

            if ($collision) {
                return response()->json([
                    'error' => "{$type['label']} '{$id}' is already used within this school.",
                ], 422);
            }
        }

        $old = $record->{$type['field']};

        $record->{$type['field']} = $id;
        $record->save();

        AuditLog::create([
            'school_id'      => $schoolId,
            'user_id'        => auth()->id(),
            'event'          => 'school_id_changed',
            'auditable_type' => $model,
            'auditable_id'   => $record->id,
            'old_values'     => ['field' => $type['field'], 'old' => $old, 'new' => $id],
            'new_values'     => ['field' => $type['field'], 'old' => $old, 'new' => $id],
        ]);

        return response()->json([
            'success' => true,
            'message' => "{$type['label']} updated.",
            'type'    => $personType,
            'id'      => $record->id,
            $type['field'] => $id,
        ]);
    }

    private function formatTokenRule(): \Closure
    {
        return function (string $attribute, $value, $fail) {
            if ($value === null || trim((string) $value) === '') {
                return;
            }

            if (! preg_match('/^(?:[A-Za-z0-9]|[\/\-_ ]|\{SEQ:\d+\}|\{SCHOOL\}|\{TYPE\}|\{YYYY\}|\{YY\})+$/', trim($value))) {
                $fail('Format may only contain letters, numbers, spaces, / - _ and the tokens {SCHOOL} {TYPE} {YYYY} {YY} {SEQ:N}.');
            }
        };
    }
}