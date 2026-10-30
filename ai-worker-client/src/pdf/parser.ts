import fs from 'fs';
import pdfParse from 'pdf-parse';
import { CvSanitizer } from '../security/sanitizer';

export class CvParser {
  /**
   * Trích xuất văn bản từ tệp PDF và BẮT BUỘC xóa ngay tệp tạm trong khối finally
   * @param filePath Đường dẫn tệp PDF tạm
   * @returns Nội dung văn bản đã được làm sạch và khử ký tự nguy hiểm
   */
  static async extractTextAndCleanup(filePath: string): Promise<string> {
    try {
      const dataBuffer = await fs.promises.readFile(filePath);
      const parsed = await pdfParse(dataBuffer);
      const rawText = parsed.text || '';

      // Làm sạch văn bản, chuẩn hóa khoảng trắng và khử ký tự điều khiển bằng CvSanitizer
      const sanitized = CvSanitizer.sanitize(rawText);
      return sanitized.cleanedText;
    } finally {
      // ĐẢM BẢO XÓA FILE TẠM NGAY LẬP TỨC KHÔNG ĐỂ LẠI DẤU VẾT TRÊN Ổ CỨNG
      try {
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
        }
      } catch (unlinkError) {
        // Ghi log cảnh báo nếu không xóa được file tạm
        console.warn(`[CvParser] Không thể xóa file tạm ${filePath}:`, unlinkError);
      }
    }
  }
}
