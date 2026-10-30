/**
 * Module bảo mật và làm sạch văn bản CV (Anti-Prompt Injection & Data Sanitizer)
 * Ngăn chặn các kỹ thuật tiêm lệnh (Jailbreak, System Override, Delimiter Hijack, XSS)
 */

export interface SanitizedCvResult {
  cleanedText: string;
  hasSuspiciousContent: boolean;
  detectedPatterns: string[];
  truncated: boolean;
}

export class CvSanitizer {
  /**
   * Giới hạn độ dài ký tự tối đa của CV đưa vào mô hình AI Local.
   * Ngăn chặn tấn công làm tràn bộ nhớ (Context Window Overflow / PDF Bomb)
   */
  public static readonly MAX_CV_LENGTH = 15000;

  /**
   * Danh sách Regex phát hiện các mẫu Prompt Injection nguy hiểm (Tiếng Anh & Tiếng Việt)
   */
  private static readonly INJECTION_PATTERNS: Array<{ name: string; regex: RegExp }> = [
    {
      name: 'INSTRUCTION_OVERRIDE_EN',
      regex: /ignore\s+(all\s+|any\s+)?(previous|prior|above|former)\s+(instructions?|rules?|prompts?|directives?)/i,
    },
    {
      name: 'INSTRUCTION_OVERRIDE_VI',
      regex: /bỏ\s+qua\s+(mọi|tất\s+cả)?\s*(hướng\s+dẫn|yêu\s+cầu|lệnh|quy\s+tắc)\s*(trước|ở\s+trên|này)?/i,
    },
    {
      name: 'SYSTEM_PROMPT_HIJACK',
      regex: /(system\s*prompt|system\s*instruction|system\s*override|developer\s*mode|dan\s*mode)\s*:/i,
    },
    {
      name: 'ROLE_HIJACK_EN',
      regex: /(you\s+are\s+now|from\s+now\s+on\s+you\s+are|act\s+as\s+an?\s+automated)\s+/i,
    },
    {
      name: 'ROLE_HIJACK_VI',
      regex: /(từ\s+bây\s+giờ\s+bạn\s+là|bạn\s+hãy\s+đóng\s+vai|hãy\s+hành\s+xử\s+như)/i,
    },
    {
      name: 'SCORE_FORCING_EN',
      regex: /(give|assign|rate|score)\s+(me|this\s+candidate|the\s+applicant)\s*(a\s*)?(score\s+of\s*)?(100|9[5-9]|full\s*marks?|strong_hire)/i,
    },
    {
      name: 'SCORE_FORCING_VI',
      regex: /(đánh\s+giá|chấm|cho)\s*(tôi|ứng\s+viên\s+này)?\s*(là\s*)?(100\s*điểm|điểm\s+tuyệt\s+đối|strong_hire|khuyên\s+nên\s+tuyển)/i,
    },
    {
      name: 'JSON_DELIMITER_HIJACK',
      regex: /```\s*json/i,
    },
  ];

  /**
   * Làm sạch văn bản CV thô từ PDF và kiểm tra các dấu hiệu can thiệp Prompt Injection
   */
  static sanitize(rawText: string): SanitizedCvResult {
    if (!rawText) {
      return {
        cleanedText: '',
        hasSuspiciousContent: false,
        detectedPatterns: [],
        truncated: false,
      };
    }

    // 1. Loại bỏ các ký tự vô hình (Zero-width spaces) và mã điều khiển nhị phân nguy hiểm
    let cleaned = rawText
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Zero-width spaces
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ') // Control chars (giữ lại \t, \n, \r)
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // 2. Quét phát hiện Prompt Injection
    const detectedPatterns: string[] = [];
    for (const item of this.INJECTION_PATTERNS) {
      if (item.regex.test(cleaned)) {
        detectedPatterns.push(item.name);
      }
    }

    // 3. Vô hiệu hóa thẻ XML giả mạo cấu trúc hệ thống và markdown codeblock delimiters
    cleaned = cleaned
      .replace(/<\/?(candidate_cv_content|system|instruction|prompt|context)[^>]*>/gi, '[STRIPPED_TAG]')
      .replace(/```[a-zA-Z0-9_-]*/g, '');

    // 4. Kiểm tra giới hạn độ dài an toàn (Safe Truncation)
    let truncated = false;
    if (cleaned.length > this.MAX_CV_LENGTH) {
      cleaned =
        cleaned.slice(0, this.MAX_CV_LENGTH) +
        '\n\n[...LƯU Ý HỆ THỐNG: Văn bản CV vượt quá giới hạn 15.000 ký tự và ĐÃ CẮT BỚT AN TOÀN...]';
      truncated = true;
    }

    return {
      cleanedText: cleaned,
      hasSuspiciousContent: detectedPatterns.length > 0,
      detectedPatterns,
      truncated,
    };
  }

  /**
   * Khử mã độc HTML/XSS cho chuỗi văn bản đầu ra trước khi gửi về Backend/Frontend
   */
  static sanitizeOutputText(input?: string | null): string {
    if (!input || typeof input !== 'string') return '';
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .trim();
  }

  /**
   * Khử mã độc HTML/XSS cho danh sách các chuỗi (ví dụ: strengths, weaknesses, skills)
   */
  static sanitizeOutputArray(items?: string[] | null): string[] {
    if (!items || !Array.isArray(items)) return [];
    return items
      .filter((item) => typeof item === 'string' && item.trim().length > 0)
      .map((item) => this.sanitizeOutputText(item));
  }
}
