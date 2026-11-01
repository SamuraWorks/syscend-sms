<?php

return [

    'default' => env('VIEW_COMPILER', 'blade'),

    'compiled' => env(
        'VIEW_COMPILED_PATH',
        storage_path('framework/views')
    ),

];
