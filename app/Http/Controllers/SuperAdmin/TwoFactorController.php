<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TwoFactorController extends Controller
{
    public function showVerifyForm()
    {
        return Inertia::render('SuperAdmin/TwoFactor/Verify');
    }

    public function verify(Request $request)
    {
        $request->validate(['code' => 'required|string|size:6']);
        
        $user = $request->user();
        $secret = $user->two_factor_secret;
        
        $ga = new \PragmaRX\Google2FA\Google2FA();
        if ($ga->verifyKey($secret, $request->code)) {
            session(['2fa_verified' => true]);
            return redirect()->route('super-admin.dashboard');
        }

        return back()->withErrors(['code' => 'Invalid 2FA code.']);
    }

    public function enable(Request $request)
    {
        $ga = new \PragmaRX\Google2FA\Google2FA();
        $secret = $ga->generateSecretKey();
        
        $request->user()->update([
            'two_factor_secret' => $secret,
            'two_factor_enabled' => false,
        ]);
        
        $qrCodeUrl = $ga->getQRCodeUrl(
            config('app.name') . ' (Super Admin)',
            $request->user()->email,
            $secret
        );
        
        return Inertia::render('SuperAdmin/TwoFactor/Enable', [
            'qrCodeUrl' => $qrCodeUrl,
            'secret' => $secret,
        ]);
    }

    public function confirmEnable(Request $request)
    {
        $request->validate(['code' => 'required|string|size:6']);
        
        $ga = new \PragmaRX\Google2FA\Google2FA();
        $secret = $request->user()->two_factor_secret;
        
        if ($ga->verifyKey($secret, $request->code)) {
            $request->user()->update(['two_factor_enabled' => true]);
            session(['2fa_verified' => true]);
            return redirect()->route('super-admin.dashboard')->with('success', '2FA enabled.');
        }
        
        return back()->withErrors(['code' => 'Invalid code.']);
    }
}
