<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class EmailVerificationController extends Controller
{
    /**
     * Verification notice shown to parents whose email is still unverified.
     */
    public function notice(Request $request): RedirectResponse|Response
    {
        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->intended(route('dashboard', absolute: false));
        }

        return Inertia::render('Auth/VerifyEmail', [
            'email' => $request->user()->email,
            'status' => session('status'),
        ]);
    }

    /**
     * Mark the authenticated user's email as verified from the signed link.
     */
    public function verify(Request $request): RedirectResponse
    {
        if (! hash_equals((string) $request->user()->getKey(), (string) $request->route('id'))) {
            abort(403);
        }

        if (! hash_equals(sha1($request->user()->getEmailForVerification()), (string) $request->route('hash'))) {
            abort(403, 'This verification link is no longer valid.');
        }

        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->intended(route('dashboard', absolute: false) . '?verified=1');
        }

        if ($request->user()->markEmailAsVerified()) {
            event(new Verified($request->user()));
        }

        activity()
            ->causedBy($request->user())
            ->log('Email address verified');

        return redirect()->intended(route('dashboard', absolute: false) . '?verified=1');
    }

    /**
     * Resend the verification email.
     */
    public function resend(Request $request): RedirectResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->intended(route('dashboard', absolute: false));
        }

        try {
            $request->user()->sendEmailVerificationNotification();
            Log::info('Verification email resent', ['user_id' => $request->user()->id]);
        } catch (\Throwable $e) {
            Log::error('Failed to send verification email: ' . $e->getMessage(), ['user_id' => $request->user()->id]);
            return back()->with('status', 'We could not send the verification email right now. Please try again shortly or contact your school.');
        }

        return back()->with('status', 'verification-link-sent');
    }
}
