<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\Guardian;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoUserSeeder extends Seeder
{
    public function run(): void
    {
        // Create demo school
        $school = School::firstOrCreate(
            ['slug' => 'greenfield-academy'],
            [
                'name'     => 'Greenfield Academy',
                'email'    => 'info@greenfield.edu',
                'phone'    => '+2327000000000',
                'address'  => '12 School Road, Freetown',
                'city'     => 'Freetown',
                'country'  => 'SL',
                'timezone' => 'Africa/Freetown',
                'currency' => 'SLL',
                'language' => 'en',
                'status'   => 'active',
            ]
        );

        // Create current academic year
        AcademicYear::firstOrCreate(
            ['school_id' => $school->id, 'name' => '2025-2026'],
            [
                'start_date' => '2025-01-01',
                'end_date'   => '2025-12-31',
                'is_current' => true,
            ]
        );

        $demoUsers = [
            [
                'name'  => 'School Admin',
                'email' => 'school-admin@syscend-campus.test',
                'role'  => 'school-admin',
            ],
            [
                'name'  => 'Principal',
                'email' => 'principal@syscend-campus.test',
                'role'  => 'principal',
            ],
            [
                'name'  => 'Teacher Demo',
                'email' => 'teacher@syscend-campus.test',
                'role'  => 'teacher',
            ],
            [
                'name'  => 'Accountant Demo',
                'email' => 'accountant@syscend-campus.test',
                'role'  => 'accountant',
            ],
            [
                'name'  => 'Librarian Demo',
                'email' => 'librarian@syscend-campus.test',
                'role'  => 'librarian',
            ],
            [
                'name'  => 'Student Demo',
                'email' => 'student@syscend-campus.test',
                'role'  => 'student',
            ],
            [
                'name'  => 'Parent Demo',
                'email' => 'parent@syscend-campus.test',
                'role'  => 'parent',
            ],
            [
                'name'  => 'Proprietor Demo',
                'email' => 'proprietor@syscend-campus.test',
                'role'  => 'proprietor',
            ],
            [
                'name'  => 'Ministry Admin',
                'email' => 'ministry@syscend-campus.test',
                'role'  => 'ministry-admin',
            ],
            [
                'name'  => 'District Officer',
                'email' => 'district@syscend-campus.test',
                'role'  => 'district-officer',
            ],
        ];

        foreach ($demoUsers as $data) {
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                [
                    'name'      => $data['name'],
                    'school_id' => $school->id,
                    'password'  => bcrypt('password'),
                    'status'    => 'active',
                ]
            );
            $user->syncRoles([$data['role']]);
        }

        // Link demo student user to a Student record
        $studentUser = User::where('email', 'student@syscend-campus.test')->first();
        if ($studentUser) {
            $class   = SchoolClass::where('school_id', $school->id)->first();
            $section = $class?->sections()->first();

            if ($class && $section) {
                $existing = Student::withoutGlobalScopes()
                    ->where('school_id', $school->id)
                    ->where('user_id', $studentUser->id)
                    ->first();

                if (! $existing) {
                    // Re-use first student record if available, otherwise create one
                    $student = Student::withoutGlobalScopes()
                        ->where('school_id', $school->id)
                        ->whereNull('user_id')
                        ->orWhere('user_id', 0)
                        ->first();

                    if ($student) {
                        $student->update(['user_id' => $studentUser->id]);
                    } else {
                        Student::create([
                            'school_id'     => $school->id,
                            'user_id'       => $studentUser->id,
                            'class_id'      => $class->id,
                            'section_id'    => $section->id,
                            'admission_no'  => 'DEMO-STU-001',
                            'roll_no'       => '01',
                            'first_name'    => 'Student',
                            'last_name'     => 'Demo',
                            'gender'        => 'male',
                            'date_of_birth' => '2008-01-01',
                            'nationality'   => 'Sierra Leonean',
                            'category'      => 'general',
                            'status'        => 'active',
                            'admission_date'=> now()->toDateString(),
                        ]);
                    }
                }
            }
        }

        // Link demo parent user to a Guardian record
        $parentUser = User::where('email', 'parent@syscend-campus.test')->first();
        if ($parentUser) {
            $existingGuardian = Guardian::withoutGlobalScopes()
                ->where('school_id', $school->id)
                ->where('user_id', $parentUser->id)
                ->first();

            if (! $existingGuardian) {
                // Find first guardian with no user_id or user_id=0
                $guardian = Guardian::withoutGlobalScopes()
                    ->where('school_id', $school->id)
                    ->where(fn ($q) => $q->whereNull('user_id')->orWhere('user_id', 0))
                    ->first();

                if ($guardian) {
                    $guardian->update(['user_id' => $parentUser->id]);
                } else {
                    Guardian::create([
                        'school_id' => $school->id,
                        'user_id'   => $parentUser->id,
                        'name'      => 'Parent Demo',
                        'relation'  => 'Father',
                        'phone'     => '+2327000000099',
                        'email'     => 'parent@syscend-campus.test',
                    ]);
                }
            }
        }

        $this->command->info('Demo school and users seeded.');
    }
}
