<?php

namespace App\Http\Controllers;

use App\Mail\ContactFormMail;
use App\Models\ContactMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class ContactController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'    => 'required|string|max:150',
            'email'   => 'required|email|max:150',
            'subject' => 'required|string|max:255',
            'message' => 'required|string|max:5000',
        ]);

        $contact = ContactMessage::create($data);

        try {
            Mail::to('syscend@gmail.com')->send(new ContactFormMail($contact));
        } catch (\Throwable $e) {
            \Log::warning('Contact form email failed: ' . $e->getMessage());
        }

        return redirect()->route('contact')
            ->with('success', 'Your message has been sent. We will get back to you within 24 hours.');
    }
}
