import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { CvSanitizer } from '../security/sanitizer';

export class CvParser {
  /**
   * Trích xuất văn bản từ tệp PDF hoặc Word (.docx) và BẮT BUỘC xóa ngay tệp tạm trong khối finally
   * @param filePath Đường dẫn tệp tạm
   * @param originalFileName Tên gốc của tệp CV (để nhận diện .docx hay .pdf)
   * @returns Nội dung văn bản đã được làm sạch và khử ký tự nguy hiểm
   */
  static async extractTextAndCleanup(filePath: string, originalFileName?: string): Promise<string> {
    try {
      const isDocx = (originalFileName && originalFileName.toLowerCase().endsWith('.docx')) ||
                     filePath.toLowerCase().endsWith('.docx');

      let rawText = '';
      if (isDocx) {
        const result = await mammoth.extractRawText({ path: filePath });
        rawText = result.value || '';
      } else {
        const dataBuffer = await fs.promises.readFile(filePath);
        const parsed = await pdfParse(dataBuffer);
        rawText = parsed.text || '';
      }

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
