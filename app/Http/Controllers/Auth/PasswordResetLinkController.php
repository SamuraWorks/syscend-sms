<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\AdminResetPasswordRequestMail;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/ForgotPassword');
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::withoutGlobalScopes()
            ->where('email', $request->email)
            ->first();

        // Notify the platform admin so they can issue the user new
        // credentials. No self-service reset link is sent.
        if ($user) {
            $adminEmail = (string) env('SYSADMIN_EMAIL', 'syscend@gmail.com');

            Mail::to($adminEmail)->send(new AdminResetPasswordRequestMail($user));
        }

        return back()->with('success', __('We have received your request. Our team will reach out with new login details.'));
    }
}