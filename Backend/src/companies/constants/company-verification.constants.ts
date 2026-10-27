export enum CompanyChecklistCode {
  LEGAL_NAME_MATCH = 'LEGAL_NAME_MATCH',
  REGISTRATION_NUMBER_MATCH = 'REGISTRATION_NUMBER_MATCH',
  ADDRESS_CONSISTENT = 'ADDRESS_CONSISTENT',
  CONTACT_REACHABLE = 'CONTACT_REACHABLE',
  DOCUMENT_READABLE = 'DOCUMENT_READABLE',
  ACCOUNT_EMAIL_VERIFIED = 'ACCOUNT_EMAIL_VERIFIED',
}

export const COMPANY_CHECKLIST_DEFINITIONS: Record<CompanyChecklistCode, string> = {
  [CompanyChecklistCode.LEGAL_NAME_MATCH]: 'Tên pháp lý khớp giấy ĐKDN',
  [CompanyChecklistCode.REGISTRATION_NUMBER_MATCH]: 'Mã số khớp giấy ĐKDN',
  [CompanyChecklistCode.ADDRESS_CONSISTENT]: 'Địa chỉ hợp lý / khớp tài liệu',
  [CompanyChecklistCode.CONTACT_REACHABLE]: 'Người liên hệ / SĐT / email hợp lệ',
  [CompanyChecklistCode.DOCUMENT_READABLE]: 'Giấy ĐKDN đọc được, đúng loại',
  [CompanyChecklistCode.ACCOUNT_EMAIL_VERIFIED]: 'Email tài khoản đã xác thực',
};

export const REQUIRED_CHECKLIST_CODES: CompanyChecklistCode[] = [
  CompanyChecklistCode.LEGAL_NAME_MATCH,
  CompanyChecklistCode.REGISTRATION_NUMBER_MATCH,
  CompanyChecklistCode.ADDRESS_CONSISTENT,
  CompanyChecklistCode.CONTACT_REACHABLE,
  CompanyChecklistCode.DOCUMENT_READABLE,
  CompanyChecklistCode.ACCOUNT_EMAIL_VERIFIED,
];

export const REJECTION_REASON_LABELS: Record<string, string> = {
  MISSING_DOCUMENT: 'Thiếu tài liệu bắt buộc',
  DOCUMENT_UNCLEAR: 'Tài liệu mờ hoặc không hợp lệ',
  NAME_MISMATCH: 'Tên doanh nghiệp không khớp giấy phép',
  REGISTRATION_MISMATCH: 'Mã số doanh nghiệp không khớp',
  ADDRESS_MISMATCH: 'Địa chỉ hoạt động không xác thực',
  CONTACT_INVALID: 'Thông tin người đại diện không hợp lệ',
  OTHER: 'Lý do khác',
};

export const SUSPENSION_REASON_LABELS: Record<string, string> = {
  POLICY_VIOLATION: 'Vi phạm chính sách nền tảng',
  FAKE_INFORMATION: 'Cung cấp thông tin giả mạo',
  ABUSIVE_POSTING: 'Đăng tin sai quy định hoặc spam',
  LEGAL_COMPLAINT: 'Có khiếu nại pháp lý hoặc tranh chấp',
  OTHER: 'Lý do khác',
};
