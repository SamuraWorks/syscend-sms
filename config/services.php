<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | SMS Gateway (Vonage / Twilio)
    |--------------------------------------------------------------------------
    |
    | Default SMS credentials. Schools can override via school_settings table.
    | Vonage (Nexmo) uses rest.nexmo.com; Twilio uses api.twilio.com.
    |
    */

    'sms' => [
        'default_provider' => env('SMS_PROVIDER', 'vonage'),
        'vonage' => [
            'api_key'    => env('VONAGE_API_KEY', ''),
            'api_secret' => env('VONAGE_API_SECRET', ''),
            'from'       => env('VONAGE_SENDER_ID', 'Syscend'),
        ],
        'twilio' => [
            'account_sid' => env('TWILIO_ACCOUNT_SID', ''),
            'auth_token'  => env('TWILIO_AUTH_TOKEN', ''),
            'from'        => env('TWILIO_FROM_NUMBER', ''),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Mobile Money Gateways (Orange Money / Afrimoney)
    |--------------------------------------------------------------------------
    |
    | Default payment gateway credentials for Sierra Leone mobile money.
    | Schools can override via school_settings table.
    | Currency: SLL (Sierra Leone Leone)
    |
    */

    'orange_money' => [
        'merchant_key' => env('ORANGE_MONEY_MERCHANT_KEY', ''),
        'api_user'     => env('ORANGE_MONEY_API_USER', ''),
        'api_key'      => env('ORANGE_MONEY_API_KEY', ''),
        'return_url'   => env('ORANGE_MONEY_RETURN_URL', ''),
        'cancel_url'   => env('ORANGE_MONEY_CANCEL_URL', ''),
        'webhook_url'  => env('ORANGE_MONEY_WEBHOOK_URL', ''),

        // Platform-level credentials for subscription billing
        'platform_merchant_key' => env('ORANGE_MONEY_PLATFORM_MERCHANT_KEY', ''),
        'platform_api_user'     => env('ORANGE_MONEY_PLATFORM_API_USER', ''),
        'platform_api_key'      => env('ORANGE_MONEY_PLATFORM_API_KEY', ''),
    ],

    'afrimoney' => [
        'api_key'    => env('AFRIMONEY_API_KEY', ''),
        'app_id'     => env('AFRIMONEY_APP_ID', ''),
        'app_secret' => env('AFRIMONEY_APP_SECRET', ''),
    ],

    // ── Monime (Sierra Leone payments: MoMo, card, bank) ──────────────
    'monime' => [
        'base_url'       => env('MONIME_BASE_URL', 'https://api.monime.io/v1'),
        'checkout_url'   => env('MONIME_CHECKOUT_URL', 'https://checkout.monime.io'),
        'access_token'   => env('MONIME_ACCESS_TOKEN', ''),
        'space_id'       => env('MONIME_SPACE_ID', ''),
        'api_version'    => env('MONIME_API_VERSION', 'caph.2025-08-23'),
        'webhook_secret' => env('MONIME_WEBHOOK_SECRET', ''),
        'success_url'    => env('MONIME_SUCCESS_URL', ''),
        'cancel_url'     => env('MONIME_CANCEL_URL', ''),
        'webhook_url'    => env('MONIME_WEBHOOK_URL', ''),
    ],

    'gemini' => [
        'api_key' => env('GEMINI_API_KEY', ''),
    ],

];
