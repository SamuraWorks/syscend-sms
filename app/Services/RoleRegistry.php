<?php

namespace App\Services;

/**
 * Single source of truth for role definitions and their boundaries.
 *
 * Every controller, middleware, seeder, and policy that needs to reason about
 * which roles belong to which portal MUST reference this class instead of
 * hard-coding role strings.
 */
final class RoleRegistry
{
    // ── Portal-level roles ────────────────────────────────────────────

    public const SUPER_ADMIN       = 'super-admin';
    public const MINISTRY_ADMIN    = 'ministry-admin';
    public const DISTRICT_OFFICER  = 'district-officer';

    // ── School-level roles ────────────────────────────────────────────

    public const SCHOOL_ADMIN      = 'school-admin';
    public const PRINCIPAL         = 'principal';
    public const TEACHER           = 'teacher';
    public const ACCOUNTANT        = 'accountant';
    public const LIBRARIAN         = 'librarian';
    public const RECEPTIONIST      = 'receptionist';
    public const DRIVER            = 'driver';
    public const WARDEN            = 'warden';
    public const STORE_MANAGER     = 'store-manager';
    public const PROPRIETOR        = 'proprietor';
    public const STUDENT           = 'student';
    public const PARENT            = 'parent';

    // ── Role sets ─────────────────────────────────────────────────────

    /** Roles that belong to a school tenant (have a school_id). */
    public const SCHOOL_ROLES = [
        self::SCHOOL_ADMIN,
        self::PRINCIPAL,
        self::TEACHER,
        self::ACCOUNTANT,
        self::LIBRARIAN,
        self::RECEPTIONIST,
        self::DRIVER,
        self::WARDEN,
        self::STORE_MANAGER,
        self::PROPRIETOR,
        self::STUDENT,
        self::PARENT,
    ];

    /** Roles that can be managed by a school-admin within their school. */
    public const SCHOOL_MANAGEABLE_ROLES = [
        self::SCHOOL_ADMIN,
        self::PRINCIPAL,
        self::TEACHER,
        self::ACCOUNTANT,
        self::LIBRARIAN,
        self::RECEPTIONIST,
        self::DRIVER,
        self::WARDEN,
        self::STORE_MANAGER,
    ];

    /** Roles that require a Staff record (portal controllers resolve via Staff::where('user_id', ...)). */
    public const STAFF_ROLES = [
        self::PRINCIPAL,
        self::TEACHER,
        self::ACCOUNTANT,
        self::LIBRARIAN,
        self::DRIVER,
        self::WARDEN,
        self::STORE_MANAGER,
    ];

    /** Portal-level roles (NOT school-scoped). */
    public const PORTAL_ROLES = [
        self::SUPER_ADMIN,
        self::MINISTRY_ADMIN,
        self::DISTRICT_OFFICER,
    ];

    /** Ministry-only roles. */
    public const MINISTRY_ROLES = [
        self::MINISTRY_ADMIN,
        self::DISTRICT_OFFICER,
    ];

    /** End-user roles (students/parents — limited portal). */
    public const END_USER_ROLES = [
        self::STUDENT,
        self::PARENT,
    ];

    /** Roles a super-admin can create from the User Management page. */
    public const SUPER_ADMIN_ASSIGNABLE_ROLES = [
        self::SUPER_ADMIN,
        self::SCHOOL_ADMIN,
    ];

    // ── Helpers ───────────────────────────────────────────────────────

    public static function isSchoolRole(string $role): bool
    {
        return in_array($role, self::SCHOOL_ROLES, true);
    }

    public static function isManageableBySchoolAdmin(string $role): bool
    {
        return in_array($role, self::SCHOOL_MANAGEABLE_ROLES, true);
    }

    public static function isPortalRole(string $role): bool
    {
        return in_array($role, self::PORTAL_ROLES, true);
    }

    public static function isMinistryRole(string $role): bool
    {
        return in_array($role, self::MINISTRY_ROLES, true);
    }

    /**
     * Can $assignerRole assign $targetRole?
     *
     * Rules:
     *  - super-admin   → can assign only SUPER_ADMIN_ASSIGNABLE_ROLES
     *  - school-admin  → can assign only SCHOOL_MANAGEABLE_ROLES
     *  - all others    → cannot assign roles at all
     */
    public static function canAssignRole(string $assignerRole, string $targetRole): bool
    {
        return match ($assignerRole) {
            self::SUPER_ADMIN => in_array($targetRole, self::SUPER_ADMIN_ASSIGNABLE_ROLES, true),
            self::SCHOOL_ADMIN => self::isManageableBySchoolAdmin($targetRole),
            default => false,
        };
    }

    /**
     * Can $assignerRole assign the given list of roles?
     */
    public static function canAssignRoles(string $assignerRole, array $targetRoles): bool
    {
        foreach ($targetRoles as $role) {
            if (!self::canAssignRole($assignerRole, $role)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Dashboard route name for the given role.
     */
    public static function dashboardRoute(string $role): string
    {
        return match ($role) {
            self::SUPER_ADMIN      => 'super-admin.dashboard',
            self::SCHOOL_ADMIN     => 'school.reports.dashboard',
            self::PRINCIPAL        => 'principal.dashboard',
            self::TEACHER          => 'teacher.dashboard',
            self::STUDENT          => 'student.dashboard',
            self::PARENT           => 'parent.dashboard',
            self::ACCOUNTANT       => 'accountant.dashboard',
            self::PROPRIETOR       => 'proprietor.dashboard',
            self::LIBRARIAN        => 'librarian.dashboard',
            self::DRIVER           => 'driver.dashboard',
            self::WARDEN           => 'warden.dashboard',
            self::STORE_MANAGER    => 'store-manager.dashboard',
            self::MINISTRY_ADMIN   => 'ministry.dashboard',
            self::DISTRICT_OFFICER => 'ministry.dashboard',
            default                => 'login',
        };
    }
}
