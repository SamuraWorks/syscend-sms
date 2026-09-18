<?php

namespace Database\Seeders;

use App\Models\Guardian;
use App\Models\Staff;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Seeder;

class PortalLinkSeeder extends Seeder
{
    public function run(): void
    {
        $studentUser = User::where('email', 'student@syscend-campus.test')->first();
        if ($studentUser) {
            $existing = Student::withoutGlobalScopes()
                ->where('user_id', $studentUser->id)
                ->first();

            if (! $existing) {
                $student = Student::withoutGlobalScopes()
                    ->whereNull('user_id')
                    ->first();

                if ($student) {
                    $student->update(['user_id' => $studentUser->id]);
                    $this->command->info("Linked student user to Student #{$student->id}");
                }
            }
        }

        $parentUser = User::where('email', 'parent@syscend-campus.test')->first();
        if ($parentUser) {
            $existingGuardian = Guardian::withoutGlobalScopes()
                ->where('user_id', $parentUser->id)
                ->first();

            if (! $existingGuardian) {
                $guardian = Guardian::withoutGlobalScopes()
                    ->whereNull('user_id')
                    ->first();

                if ($guardian) {
                    $guardian->update(['user_id' => $parentUser->id]);
                    $this->command->info("Linked parent user to Guardian #{$guardian->id}");

                    $children = Student::withoutGlobalScopes()
                        ->where('guardian_id', $guardian->id)
                        ->limit(3)
                        ->pluck('id');

                    $this->command->info("Guardian #{$guardian->id} has {$children->count()} children");
                }
            }
        }

        // Link teacher user to a Staff record
        $teacherUser = User::where('email', 'teacher@syscend-campus.test')->first();
        if ($teacherUser) {
            $existingStaff = Staff::withoutGlobalScopes()
                ->where('user_id', $teacherUser->id)
                ->first();

            if (! $existingStaff) {
                $staff = Staff::withoutGlobalScopes()
                    ->where('school_id', $teacherUser->school_id)
                    ->whereNull('user_id')
                    ->first();

                if ($staff) {
                    $staff->update(['user_id' => $teacherUser->id]);
                    $this->command->info("Linked teacher user to Staff #{$staff->id}");
                } else {
                    Staff::create([
                        'school_id'      => $teacherUser->school_id,
                        'user_id'        => $teacherUser->id,
                        'department_id'  => 1,
                        'designation_id' => 16,
                        'teacher_type'   => 'both',
                        'first_name'     => 'Teacher',
                        'last_name'      => 'Demo',
                        'emp_id'         => 'DEMO-TCH-001',
                        'gender'         => 'male',
                        'phone'          => '+232770000003',
                        'email'          => 'teacher@syscend-campus.test',
                        'joining_date'   => now()->toDateString(),
                        'salary_type'    => 'monthly',
                        'salary'         => 0,
                        'status'         => 'active',
                    ]);
                    $this->command->info("Created teacher staff record");
                }
            }
        }

        // Link accountant user to a Staff record
        $accountantUser = User::where('email', 'accountant@syscend-campus.test')->first();
        if ($accountantUser) {
            $existingStaff = Staff::withoutGlobalScopes()
                ->where('user_id', $accountantUser->id)
                ->first();

            if (! $existingStaff) {
                $staff = Staff::withoutGlobalScopes()
                    ->where('school_id', $accountantUser->school_id)
                    ->whereNull('user_id')
                    ->first();

                if ($staff) {
                    $staff->update(['user_id' => $accountantUser->id]);
                    $this->command->info("Linked accountant user to Staff #{$staff->id}");
                } else {
                    Staff::create([
                        'school_id'      => $accountantUser->school_id,
                        'user_id'        => $accountantUser->id,
                        'department_id'  => 5,
                        'designation_id' => 15,
                        'first_name'     => 'Accountant',
                        'last_name'      => 'Demo',
                        'emp_id'         => 'DEMO-ACC-001',
                        'gender'         => 'female',
                        'phone'          => '+232770000004',
                        'email'          => 'accountant@syscend-campus.test',
                        'joining_date'   => now()->toDateString(),
                        'salary_type'    => 'monthly',
                        'salary'         => 0,
                        'status'         => 'active',
                    ]);
                    $this->command->info("Created accountant staff record");
                }
            }
        }

        // Link principal user to a Staff record with Principal designation
        $principalUser = User::where('email', 'principal@syscend-campus.test')->first();
        if ($principalUser) {
            $existingStaff = Staff::withoutGlobalScopes()
                ->where('user_id', $principalUser->id)
                ->first();

            if (! $existingStaff) {
                // Prefer a staff record with Principal designation (designation_id 14) that has no user linked
                $staff = Staff::withoutGlobalScopes()
                    ->where('school_id', $principalUser->school_id)
                    ->where('designation_id', 14)
                    ->whereNull('user_id')
                    ->first();

                if (! $staff) {
                    $staff = Staff::withoutGlobalScopes()
                        ->where('school_id', $principalUser->school_id)
                        ->whereNull('user_id')
                        ->first();
                }

                if ($staff) {
                    $staff->update(['user_id' => $principalUser->id]);
                    $this->command->info("Linked principal user to Staff #{$staff->id}");
                } else {
                    Staff::create([
                        'school_id'      => $principalUser->school_id,
                        'user_id'        => $principalUser->id,
                        'department_id'  => 5,
                        'designation_id' => 14,
                        'first_name'     => 'Principal',
                        'last_name'      => 'Demo',
                        'emp_id'         => 'DEMO-PRI-001',
                        'gender'         => 'male',
                        'phone'          => '+232770000002',
                        'email'          => 'principal@syscend-campus.test',
                        'joining_date'   => now()->toDateString(),
                        'salary_type'    => 'monthly',
                        'salary'         => 0,
                        'status'         => 'active',
                    ]);
                    $this->command->info("Created principal staff record for Principal Demo");
                }
            }
        }

        // Link proprietor user to a Staff record
        $proprietorUser = User::where('email', 'proprietor@syscend-campus.test')->first();
        if ($proprietorUser) {
            $existingStaff = Staff::withoutGlobalScopes()
                ->where('user_id', $proprietorUser->id)
                ->first();

            if (! $existingStaff) {
                $staff = Staff::withoutGlobalScopes()
                    ->whereNull('user_id')
                    ->first();

                if ($staff) {
                    $staff->update(['user_id' => $proprietorUser->id]);
                    $this->command->info("Linked proprietor user to Staff #{$staff->id}");
                } else {
                    // Create a proprietor staff record
                    Staff::create([
                        'school_id'  => $proprietorUser->school_id,
                        'user_id'    => $proprietorUser->id,
                        'first_name' => 'Proprietor',
                        'last_name'  => 'Demo',
                        'emp_id'     => 'DEMO-PRP-001',
                        'gender'     => 'male',
                        'phone'      => '+232770000001',
                        'email'      => 'proprietor@syscend-campus.test',
                        'joining_date' => now()->toDateString(),
                        'status'     => 'active',
                    ]);
                    $this->command->info("Created proprietor staff record for Proprietor Demo");
                }
            }
        }

        $this->command->info('Portal accounts linked.');
    }
}
