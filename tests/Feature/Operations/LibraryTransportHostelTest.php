<?php

namespace Tests\Feature\Operations;

use App\Models\BookIssue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithDomain;
use Tests\TestCase;

class LibraryTransportHostelTest extends TestCase
{
    use RefreshDatabase, InteractsWithDomain;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedAllRolesAndPermissions();
    }

    private function schoolWithClass(): array
    {
        $school = $this->createSchool();
        $this->activateSchool($school);
        $this->actingAsSchoolAdmin($school);
        $class = $this->createClass($school, ['school_level' => 'junior_secondary']);
        return [$school, $class];
    }

    // ── Library ───────────────────────────────────────────────────

    public function test_books_index_returns_ok(): void
    {
        [$school] = $this->schoolWithClass();
        $this->createBook($school);

        $this->get(route('school.library.books.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('SchoolAdmin/Library/Books'));
    }

    public function test_book_can_be_added(): void
    {
        [$school] = $this->schoolWithClass();

        $this->post(route('school.library.books.store'), [
            'title'        => 'Understanding Chemistry',
            'author'       => 'John Doe',
            'category'     => 'Science',
            'total_copies' => 4,
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('books', [
            'school_id'        => $school->id,
            'title'            => 'Understanding Chemistry',
            'total_copies'     => 4,
            'available_copies' => 4,
        ]);
    }

    public function test_book_store_requires_title_and_author(): void
    {
        [$school] = $this->schoolWithClass();

        $this->post(route('school.library.books.store'), [
            'total_copies' => 1,
        ])->assertSessionHasErrors(['title', 'author']);
    }

    public function test_book_can_be_deleted(): void
    {
        [$school] = $this->schoolWithClass();
        $book = $this->createBook($school);

        $this->delete(route('school.library.books.destroy', $book))
            ->assertRedirect()->assertSessionHas('success');

        $this->assertSoftDeleted('books', ['id' => $book->id]);
    }

    public function test_book_can_be_issued_and_returned(): void
    {
        [$school, $class] = $this->schoolWithClass();
        $book = $this->createBook($school, ['available_copies' => 2]);
        $student = $this->createStudent($school, $class, ['admission_no' => 'ADM-LIB-001']);

        $this->post(route('school.library.issues.store'), [
            'book_id'     => $book->id,
            'member_type' => 'student',
            'member_id'   => $student->id,
            'issued_date' => '2026-03-01',
            'due_date'    => '2026-03-10',
        ])->assertRedirect()->assertSessionHas('success');

        $issue = BookIssue::where('school_id', $school->id)->where('book_id', $book->id)->first();
        $this->assertNotNull($issue);
        $this->assertSame(1, (int) $book->fresh()->available_copies);

        $this->put(route('school.library.issues.return', $issue), [
            'returned_date' => '2026-03-09',
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertSame('returned', $issue->fresh()->status);
        $this->assertSame(2, (int) $book->fresh()->available_copies);
    }

    public function test_book_without_copies_cannot_be_issued(): void
    {
        [$school, $class] = $this->schoolWithClass();
        $book = $this->createBook($school, ['available_copies' => 0]);
        $student = $this->createStudent($school, $class, ['admission_no' => 'ADM-LIB-002']);

        $this->post(route('school.library.issues.store'), [
            'book_id'     => $book->id,
            'member_type' => 'student',
            'member_id'   => $student->id,
            'issued_date' => '2026-03-01',
            'due_date'    => '2026-03-10',
        ])->assertSessionHasErrors('book_id');
    }

    public function test_library_issues_index_returns_ok(): void
    {
        [$school, $class] = $this->schoolWithClass();
        $book = $this->createBook($school);
        $student = $this->createStudent($school, $class, ['admission_no' => 'ADM-LIB-003']);
        $this->post(route('school.library.issues.store'), [
            'book_id'     => $book->id,
            'member_type' => 'student',
            'member_id'   => $student->id,
            'issued_date' => '2026-03-01',
            'due_date'    => '2026-03-10',
        ]);

        $this->get(route('school.library.issues.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('SchoolAdmin/Library/Issues'));
    }

    // ── Transport ─────────────────────────────────────────────────

    public function test_vehicles_index_returns_ok(): void
    {
        [$school] = $this->schoolWithClass();
        $this->createVehicle($school);

        $this->get(route('school.transport.vehicles'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('SchoolAdmin/Transport/Vehicles'));
    }

    public function test_vehicle_can_be_added(): void
    {
        [$school] = $this->schoolWithClass();

        $this->post(route('school.transport.vehicles.store'), [
            'registration_no' => 'SL-2024-XX',
            'type'            => 'bus',
            'capacity'        => 45,
            'driver_name'     => 'Sahr B.',
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('vehicles', [
            'school_id'       => $school->id,
            'registration_no' => 'SL-2024-XX',
            'type'            => 'bus',
            'capacity'        => 45,
        ]);
    }

    public function test_vehicle_requires_valid_type(): void
    {
        [$school] = $this->schoolWithClass();

        $this->post(route('school.transport.vehicles.store'), [
            'registration_no' => 'SL-2024-YY',
            'type'            => 'helicopter',
            'capacity'        => 5,
        ])->assertSessionHasErrors('type');
    }

    public function test_transport_route_can_be_created(): void
    {
        [$school] = $this->schoolWithClass();
        $vehicle = $this->createVehicle($school);

        $this->post(route('school.transport.routes.store'), [
            'name'        => 'Freetown – Wellington',
            'vehicle_id'  => $vehicle->id,
            'start_point' => 'Freetown',
            'end_point'   => 'Wellington',
            'monthly_fee' => 120,
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('routes', [
            'school_id'  => $school->id,
            'name'       => 'Freetown – Wellington',
        ]);
    }

    public function test_transport_route_requires_name(): void
    {
        [$school] = $this->schoolWithClass();

        $this->post(route('school.transport.routes.store'), [])
            ->assertSessionHasErrors('name');
    }

    public function test_transport_route_can_be_deleted(): void
    {
        [$school] = $this->schoolWithClass();
        $route = $this->createTransportRoute($school);

        $this->delete(route('school.transport.routes.destroy', $route))
            ->assertRedirect()->assertSessionHas('success');

        $this->assertSoftDeleted('routes', ['id' => $route->id]);
    }

    // ── Hostel ────────────────────────────────────────────────────

    public function test_hostel_index_returns_ok(): void
    {
        [$school] = $this->schoolWithClass();
        $this->createHostel($school);

        $this->get(route('school.hostel.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('SchoolAdmin/Hostel/Index'));
    }

    public function test_hostel_can_be_created(): void
    {
        [$school] = $this->schoolWithClass();

        $this->post(route('school.hostel.store'), [
            'name'    => 'Boys Dormitory',
            'type'    => 'boys',
            'address' => 'Campus Way',
            'status'  => 'active',
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('hostels', [
            'school_id' => $school->id,
            'name'      => 'Boys Dormitory',
            'type'      => 'boys',
        ]);
    }

    public function test_hostel_requires_valid_type_and_status(): void
    {
        [$school] = $this->schoolWithClass();

        $this->post(route('school.hostel.store'), [
            'name'   => 'Bad Hostel',
            'type'   => 'coed',
            'status' => 'reserved',
        ])->assertSessionHasErrors(['type', 'status']);
    }

    public function test_hostel_room_can_be_added(): void
    {
        [$school] = $this->schoolWithClass();
        $hostel = $this->createHostel($school);

        $this->post(route('school.hostel.rooms.store', $hostel), [
            'room_no'     => '101',
            'type'        => 'double',
            'capacity'    => 2,
            'monthly_fee' => 60,
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('hostel_rooms', [
            'school_id' => $school->id,
            'hostel_id' => $hostel->id,
            'room_no'   => '101',
            'capacity'  => 2,
        ]);
        $this->assertSame(11, (int) $hostel->fresh()->total_rooms);
    }

    public function test_student_can_be_allocated_and_vacated(): void
    {
        [$school, $class] = $this->schoolWithClass();
        $hostel = $this->createHostel($school);
        $room = $this->createHostelRoom($school, $hostel, ['capacity' => 2, 'occupied' => 0]);
        $student = $this->createStudent($school, $class, ['admission_no' => 'ADM-HST-001']);

        $this->post(route('school.hostel.allocations.store'), [
            'hostel_id'    => $hostel->id,
            'room_id'      => $room->id,
            'student_id'   => $student->id,
            'joining_date' => '2026-04-01',
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('hostel_allocations', [
            'school_id'  => $school->id,
            'student_id' => $student->id,
            'hostel_id'  => $hostel->id,
            'room_id'    => $room->id,
            'status'     => 'active',
        ]);
        $this->assertSame(1, (int) $room->fresh()->occupied);

        $allocation = \App\Models\HostelAllocation::where('student_id', $student->id)->firstOrFail();
        $this->put(route('school.hostel.vacate', $allocation), [
            'leaving_date' => '2026-05-01',
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertSame('left', $allocation->fresh()->status);
        $this->assertSame(0, (int) $room->fresh()->occupied);
    }

    public function test_full_room_rejects_allocation(): void
    {
        [$school, $class] = $this->schoolWithClass();
        $hostel = $this->createHostel($school);
        $room = $this->createHostelRoom($school, $hostel, ['capacity' => 1, 'occupied' => 1, 'status' => 'full']);
        $student = $this->createStudent($school, $class, ['admission_no' => 'ADM-HST-002']);

        $this->post(route('school.hostel.allocations.store'), [
            'hostel_id'    => $hostel->id,
            'room_id'      => $room->id,
            'student_id'   => $student->id,
            'joining_date' => '2026-04-02',
        ])->assertSessionHasErrors('room_id');
    }
}