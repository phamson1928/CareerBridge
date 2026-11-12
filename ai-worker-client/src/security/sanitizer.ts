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
   * Danh sách Regex phát hiện các mẫu Prompt Injection nguy hiểm (Tiếng Anh & Tiếng Việt có dấu + không dấu)
   */
  private static readonly INJECTION_PATTERNS: Array<{ name: string; regex: RegExp }> = [
    {
      name: 'INSTRUCTION_OVERRIDE_EN',
      regex: /ignore\s+(all\s+|any\s+)?(previous|prior|above|former)\s+(instructions?|rules?|prompts?|directives?)/i,
    },
    {
      name: 'INSTRUCTION_OVERRIDE_VI',
      regex: /(bỏ|bo)\s+qua\s+(mọi|moi|tất\s+cả|tat\s+ca)?\s*(hướng\s+dẫn|huong\s+dan|yêu\s+cầu|yeu\s+cau|lệnh|lenh|quy\s+tắc|quy\s+tac)\s*(trước|truoc|ở\s+trên|o\s+tren|này|nay)?/i,
    },
    {
      name: 'SYSTEM_PROMPT_HIJACK',
      regex: /(system\s*(prompt\s*override|prompt|instruction|override)|developer\s*mode|dan\s*mode)\s*:/i,
    },
    {
      name: 'ROLE_HIJACK_EN',
      regex: /(you\s+are\s+now|from\s+now\s+on\s+you\s+are|act\s+as\s+an?\s+automated)\s+/i,
    },
    {
      name: 'ROLE_HIJACK_VI',
      regex: /(từ|tu)\s+(bây|bay)\s+(giờ|gio)\s+(bạn|ban)\s+(là|la)|(bạn|ban)\s+(hãy|hay)\s+(đóng|dong)\s+vai|(hãy|hay)\s+(hành|hanh)\s+(xử|xu)\s+như/i,
    },
    {
      name: 'SCORE_FORCING_EN',
      regex: /(give|assign|rate|score)\s+(me|this\s+candidate|the\s+applicant)\s*(a\s*)?(score\s+of\s*)?(100|9[5-9]|full\s*marks?|strong_hire)/i,
    },
    {
      name: 'SCORE_FORCING_VI',
      regex: /(đánh\s+giá|danh\s+gia|chấm|cham|cho)\s*(tôi|toi|ứng\s+viên|ung\s+vien)?\s*(là\s*|la\s*)?(100\s*điểm|100\s*diem|điểm\s+tuyệt\s+đối|diem\s+tuyet\s+doi|strong_hire|khuyên\s+nên\s+tuyển|khuyen\s+nen\s+tuyen)/i,
    },
    {
      name: 'JSON_DELIMITER_HIJACK',
      regex: /```\s*json/i,
    },
    {
      name: 'XML_DELIMITER_ESCAPE',
      regex: /<\/?(candidate_cv_content|system|instruction|prompt|context)[^>]*>/i,
    },
    {
      name: 'XSS_HTML_PAYLOAD',
      regex: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>|<(img|iframe|svg|body|input|link|a)\b[^>]*\bon\w+\s*=/i,
    },
    {
      name: 'SOCIAL_ENGINEERING_VIP',
      regex: /(chủ\s*tịch|chu\s*tich|tổng\s*giám\s*đốc|tong\s*giam\s*doc|ban\s*giám\s*đốc|ban\s*giam\s*doc|lãnh\s*đạo|lanh\s*dao|con\s*trai|con\s*gái|con\s*gai|người\s*nhà|nguoi\s*nha).*(100\s*điểm|100\s*diem|strong_hire|bắt\s*buộc\s*phải|bat\s*buoc\s*phai)/i,
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

    const detectedPatterns: string[] = [];

    // 0. Phát hiện ký tự ẩn (Zero-width cloaking)
    if (/[\u200B-\u200D\uFEFF]/.test(rawText)) {
      detectedPatterns.push('ZERO_WIDTH_CLOAKING');
    }

    // 1. Loại bỏ các ký tự vô hình (Zero-width spaces) và mã điều khiển nhị phân nguy hiểm
    let cleaned = rawText
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Zero-width spaces
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ') // Control chars (giữ lại \t, \n, \r)
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // 2. Quét phát hiện Prompt Injection (kiểm tra cả bản gốc và bản chuẩn hóa không dấu)
    const unaccented = cleaned
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');

    for (const item of this.INJECTION_PATTERNS) {
      if (item.regex.test(cleaned) || item.regex.test(unaccented)) {
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
