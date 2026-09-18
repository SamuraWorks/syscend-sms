<?php

namespace App\Http\Controllers;

use App\Mail\AdminDemoRequestMail;
use App\Models\DemoRequest;
use App\Models\DemoRequestStatusHistory;
use App\Notifications\DemoRequestReceived;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class DemoRequestController extends Controller
{
    public function show()
    {
        return Inertia::render('Public/RequestDemo');
    }

    public function submit(Request $request)
    {
        // Convert empty strings to null for nullable fields
        $input = $request->all();
        foreach (['number_of_students', 'number_of_teachers', 'preferred_day', 'preferred_time', 'biggest_challenge', 'contact_whatsapp'] as $field) {
            if (isset($input[$field]) && $input[$field] === '') {
                $input[$field] = null;
            }
        }
        $request->merge($input);

        $data = $request->validate([
            'school_name'              => 'required|string|max:200',
            'school_type'              => 'required|in:government,government_assisted,private,community,faith_based',
            'school_level'             => 'required|in:nursery,primary,junior_secondary,senior_secondary,combined',
            'district'                 => 'required|string|max:100',
            'number_of_students'       => 'nullable|integer|min:1',
            'number_of_teachers'       => 'nullable|integer|min:1',
            'contact_name'             => 'required|string|max:150',
            'contact_position'         => 'required|in:proprietor,principal,school_admin,ict_officer,accountant,other',
            'contact_email'            => 'required|email|max:150',
            'contact_phone'            => 'required|string|max:25',
            'contact_whatsapp'         => 'nullable|string|max:25',
            'modules_of_interest'      => 'required|array|min:1',
            'modules_of_interest.*'    => 'string|max:100',
            'current_management'       => 'required|in:paper,excel,another_system,custom_software,other',
            'biggest_challenge'        => 'nullable|string|max:2000',
            'preferred_contact_method' => 'required|in:phone,whatsapp,email',
            'preferred_day'            => 'nullable|string|max:30',
            'preferred_time'           => 'nullable|string|max:30',
        ]);

        $demo = DemoRequest::create(array_merge($data, [
            'ip_address'  => $request->ip(),
            'user_agent'  => $request->userAgent(),
        ]));

        DemoRequestStatusHistory::create([
            'demo_request_id' => $demo->id,
            'new_status'      => 'new',
            'notes'           => 'Demo request submitted via web form.',
        ]);

        // Notify school (non-blocking — redirect even if mail fails)
        try {
            $demo->notify(new DemoRequestReceived($demo));
        } catch (\Throwable $e) {
            \Log::warning('Demo request notification failed: ' . $e->getMessage());
        }

        // Notify platform admin at syscend@gmail.com
        try {
            Mail::to('syscend@gmail.com')->send(new AdminDemoRequestMail($demo));
        } catch (\Throwable $e) {
            \Log::warning('Demo request admin email failed: ' . $e->getMessage());
        }

        return redirect()->route('demo.thank-you')
            ->with('request_id', $demo->request_id);
    }

    public function thankYou()
    {
        return Inertia::render('Public/DemoThankYou', [
            'request_id' => session('request_id'),
        ]);
    }
}
