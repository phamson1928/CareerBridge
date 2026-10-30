import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';

export class CvDownloader {
  private static tempDir = path.join(os.tmpdir(), 'careerbridge-cv-temp');

  private static ensureTempDir(): void {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Tải tệp CV từ Signed URL vào thư mục tạm thời của hệ điều hành
   * @param downloadUrl URL tải có thời hạn ngắn
   * @param jobId ID tác vụ quét CV
   * @returns Đường dẫn tệp tạm thời trên đĩa
   */
  static async downloadToTemp(downloadUrl: string, jobId: string): Promise<string> {
    this.ensureTempDir();
    const tempFilePath = path.join(this.tempDir, `cv_${jobId}_${Date.now()}.pdf`);

    const response = await axios({
      method: 'GET',
      url: downloadUrl,
      responseType: 'stream',
      timeout: 30000,
    });

    const writer = fs.createWriteStream(tempFilePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(tempFilePath));
      writer.on('error', (err) => {
        // Xóa file nếu bị lỗi trong lúc tải
        try {
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
          }
        } catch {
          // Bỏ qua lỗi xóa file tạm
        }
        reject(err);
      });
    });
  }
}
