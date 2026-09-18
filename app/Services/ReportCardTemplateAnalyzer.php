<?php

namespace App\Services;

use App\Models\ReportCardTemplate;
use Illuminate\Support\Facades\{Http, Storage};

class ReportCardTemplateAnalyzer
{
    public function analyze(ReportCardTemplate $template): array
    {
        $apiKey = config('services.gemini.api_key');

        if (!$apiKey || !$template->front_image_path) {
            return $this->getMockAnalysis();
        }

        $imagePath = Storage::disk('public')->path($template->front_image_path);
        $fileContent = file_get_contents($imagePath);
        $base64 = base64_encode($fileContent);
        $mimeType = mime_content_type($imagePath) ?: 'image/jpeg';

        $prompt = $this->getAnalysisPrompt();

        $model = 'gemini-2.0-flash';
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

        $response = Http::timeout(120)->post($url, [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $prompt],
                        [
                            'inline_data' => [
                                'mime_type' => $mimeType,
                                'data'      => $base64,
                            ],
                        ],
                    ],
                ],
            ],
            'generationConfig' => [
                'temperature'     => 0.1,
                'maxOutputTokens' => 4096,
            ],
        ]);

        if ($response->failed()) {
            throw new \RuntimeException('Gemini API error: ' . $response->json('error.message', 'Unknown'));
        }

        $content = $response->json('candidates.0.content.parts.0.text', '');

        preg_match('/\{[\s\S]*\}/', $content, $matches);
        if (empty($matches[0])) {
            throw new \RuntimeException('Failed to parse AI response as JSON');
        }

        $parsed = json_decode($matches[0], true);
        if (!$parsed) {
            throw new \RuntimeException('Invalid JSON in AI response');
        }

        return [
            'extracted_data'   => $parsed['extracted'] ?? $parsed,
            'confidence_score' => $parsed['overall_confidence'] ?? 0,
            'template_config'  => $this->buildTemplateConfig($parsed),
        ];
    }

    private function getAnalysisPrompt(): string
    {
        return <<<'PROMPT'
You are analyzing a school report card image. Your job is to understand its layout, design, and structure so we can recreate it as a digital template.

Analyze the image and extract the following information:

1. LAYOUT STRUCTURE:
   - Overall layout orientation (portrait/landscape)
   - Header section: what elements appear (logo, school name, address, motto, etc.) and their approximate positions
   - Footer section: what elements appear and their positions
   - Whether there is a border or frame around the document

2. COLOR SCHEME:
   - Primary color (main accent color used for headers, borders)
   - Secondary color (if any)
   - Background colors
   - Text colors

3. TYPOGRAPHY:
   - Header font style (bold, size estimate relative to page)
   - Body font style
   - Any special text styling

4. SUBJECT TABLE STRUCTURE:
   - Column headers (e.g., Subject, CA, Exam, Total, Grade, Remarks)
   - Column order from left to right
   - Whether there are merged header rows
   - Number of subject rows visible

5. SECTIONS PRESENT (check each):
   - Student info section (name, class, admission number, etc.)
   - Subject performance table
   - Attendance summary
   - Remarks/comments section
   - Grade scale/reference table
   - Signature area
   - Stamp area

6. SIGNATURE & STAMP POSITIONS:
   - Where signatures appear (left/center/right, approximate y-position from top)
   - Where stamp appears
   - How many signature lines

7. SCHOOL BRANDING ELEMENTS:
   - Logo position and approximate size
   - Badge/crest position (if separate from logo)
   - Any decorative elements (borders, bars, gradients)

Return your analysis as JSON:
{
  "overall_confidence": 0.0 to 1.0,
  "extracted": {
    "layout": {
      "orientation": "portrait or landscape",
      "has_border": true/false,
      "header_elements": ["logo", "school_name", "address", "motto"],
      "footer_elements": ["school_name", "generated_date"]
    },
    "colors": {
      "primary": "#hex",
      "secondary": "#hex",
      "header_bg": "#hex",
      "header_text": "#hex",
      "body_bg": "#hex",
      "body_text": "#hex",
      "accent": "#hex"
    },
    "typography": {
      "header_style": "bold, uppercase, etc",
      "body_style": "normal, size estimate"
    },
    "table_structure": {
      "columns": ["Subject", "CA Score", "Exam Score", "Total", "Grade", "Remarks"],
      "column_order": [0, 1, 2, 3, 4, 5],
      "has_merged_headers": false,
      "subject_count_estimate": 8
    },
    "sections": {
      "student_info": true,
      "subject_table": true,
      "attendance": true,
      "remarks": true,
      "grade_scale": true,
      "signatures": true,
      "stamp": false
    },
    "signature_positions": {
      "count": 3,
      "positions": ["left", "center", "right"],
      "y_position": "bottom"
    },
    "branding": {
      "logo_position": "top-center",
      "logo_size": "medium",
      "has_badge": false,
      "decorative_elements": ["flag-bar", "border-bottom"]
    }
  },
  "confidence_scores": {
    "layout": 0.0 to 1.0,
    "colors": 0.0 to 1.0,
    "table_structure": 0.0 to 1.0,
    "sections": 0.0 to 1.0,
    "signatures": 0.0 to 1.0
  }
}

RULES:
- If you cannot determine a color, use null
- If you cannot read text, flag confidence below 0.5
- Be precise about column order
- Identify ALL sections present in the document
- Do not guess — use null for uncertain values
PROMPT;
    }

    private function buildTemplateConfig(array $parsed): array
    {
        $extracted = $parsed['extracted'] ?? $parsed;

        return [
            'layout'      => $extracted['layout'] ?? null,
            'colors'      => $extracted['colors'] ?? null,
            'typography'  => $extracted['typography'] ?? null,
            'table'       => $extracted['table_structure'] ?? null,
            'sections'    => $extracted['sections'] ?? null,
            'signatures'  => $extracted['signature_positions'] ?? null,
            'branding'    => $extracted['branding'] ?? null,
        ];
    }

    private function getMockAnalysis(): array
    {
        return [
            'extracted_data' => [
                'layout' => ['orientation' => 'portrait', 'has_border' => false],
                'colors' => ['primary' => '#1e3a5f', 'secondary' => null],
                'sections' => ['student_info' => true, 'subject_table' => true, 'attendance' => true, 'remarks' => true, 'signatures' => true],
            ],
            'confidence_score' => 0,
            'template_config' => [
                'layout' => ['orientation' => 'portrait'],
                'colors' => ['primary' => '#1e3a5f'],
            ],
        ];
    }
}
