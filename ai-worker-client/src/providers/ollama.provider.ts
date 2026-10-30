import axios from 'axios';
import {
  AiCandidateRecommendation,
  InternshipJobInfo,
} from '../api/types';
import { AiAnalysisResult, AiProvider } from './base.provider';

export class OllamaAiProvider implements AiProvider {
  readonly name = 'Ollama-Local-LLM';
  readonly modelName: string;
  private readonly baseUrl: string;

  constructor(baseUrl: string, modelName: string) {
    this.baseUrl = baseUrl;
    this.modelName = modelName;
  }

  async analyze(cvText: string, jobInfo: InternshipJobInfo): Promise<AiAnalysisResult> {
    const prompt = this.buildPrompt(cvText, jobInfo);

    const response = await axios.post(
      `${this.baseUrl}/api/generate`,
      {
        model: this.modelName,
        prompt,
        stream: false,
        format: 'json',
        options: {
          temperature: 0.2,
          top_p: 0.9,
        },
      },
      {
        timeout: 120000, // 2 phút cho mô hình local suy nghĩ
      }
    );

    const rawOutput = response.data?.response;
    if (!rawOutput || typeof rawOutput !== 'string') {
      throw new Error('Ollama không trả về dữ liệu văn bản hợp lệ');
    }

    return this.parseAndValidateResponse(rawOutput);
  }

  private buildPrompt(cvText: string, jobInfo: InternshipJobInfo): string {
    const requiredSkillsList = jobInfo.requiredSkills
      .map((s) => `- ${s.name} (Bắt buộc: ${s.isRequired ? 'Có' : 'Không'}, Trọng số: ${s.weight})`)
      .join('\n');

    return `Bạn là một chuyên gia tuyển dụng nhân sự cấp cao. Hãy đánh giá hồ sơ ứng viên (CV) dựa trên tin tuyển dụng sau.

[THÔNG TIN TIN TUYỂN DỤNG]
Vị trí: ${jobInfo.title}
Phòng ban: ${jobInfo.department || 'Không chỉ định'}
Mô tả công việc:
${jobInfo.description}

Yêu cầu tuyển dụng:
${jobInfo.requirements || 'Theo mô tả công việc'}

Danh sách kỹ năng cần đối chiếu:
${requiredSkillsList || 'Không có kỹ năng cụ thể'}

[NỘI DUNG CV CỦA ỨNG VIÊN]
${cvText}

[YÊU CẦU ĐẦU RA]
Chỉ trả về duy nhất một chuỗi JSON hợp lệ (không kèm bất kỳ văn bản giải thích nào khác), với cấu trúc sau:
{
  "aiScore": <số nguyên từ 0 đến 100, thể hiện mức độ phù hợp>,
  "recommendation": <chọn 1 trong 4 giá trị: "STRONG_HIRE" | "HIRE" | "POTENTIAL" | "NOT_RECOMMENDED">,
  "experienceYears": <số năm kinh nghiệm ước tính, ví dụ 1.5 hoặc 0 nếu mới ra trường>,
  "extractedSkills": [<mảng các kỹ năng công nghệ/chuyên môn tìm thấy trong CV>],
  "matchedSkills": [<mảng các kỹ năng từ tin tuyển dụng mà ứng viên ĐÁP ỨNG ĐƯỢC>],
  "missingSkills": [<mảng các kỹ năng từ tin tuyển dụng mà ứng viên CÒN THIẾU>],
  "strengths": [<mảng 2-4 điểm mạnh nổi bật của ứng viên bằng tiếng Việt>],
  "weaknesses": [<mảng 2-3 điểm còn thiếu hoặc cần lưu ý khi phỏng vấn bằng tiếng Việt>],
  "summary": "<1 đoạn văn tóm tắt cô đọng 2-4 câu về năng lực ứng viên bằng tiếng Việt>"
}
`;
  }

  private parseAndValidateResponse(rawJsonStr: string): AiAnalysisResult {
    // Làm sạch nếu model bọc markdown codeblock
    let cleaned = rawJsonStr.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      throw new Error(`Không thể phân tích định dạng JSON từ Ollama: ${cleaned.slice(0, 200)}...`);
    }

    // 1. Validate điểm aiScore (0 - 100)
    let aiScore = typeof parsed.aiScore === 'number' ? Math.round(parsed.aiScore) : 60;
    aiScore = Math.min(100, Math.max(0, aiScore));

    // 2. Validate recommendation
    const validRecs: AiCandidateRecommendation[] = [
      'STRONG_HIRE',
      'HIRE',
      'POTENTIAL',
      'NOT_RECOMMENDED',
    ];
    let recommendation: AiCandidateRecommendation = 'POTENTIAL';
    if (validRecs.includes(parsed.recommendation)) {
      recommendation = parsed.recommendation;
    } else {
      if (aiScore >= 85) recommendation = 'STRONG_HIRE';
      else if (aiScore >= 70) recommendation = 'HIRE';
      else if (aiScore >= 50) recommendation = 'POTENTIAL';
      else recommendation = 'NOT_RECOMMENDED';
    }

    // 3. Arrays
    const extractedSkills = Array.isArray(parsed.extractedSkills)
      ? parsed.extractedSkills.map(String)
      : [];
    const matchedSkills = Array.isArray(parsed.matchedSkills)
      ? parsed.matchedSkills.map(String)
      : [];
    const missingSkills = Array.isArray(parsed.missingSkills)
      ? parsed.missingSkills.map(String)
      : [];
    const strengths = Array.isArray(parsed.strengths)
      ? parsed.strengths.map(String)
      : ['Có nền tảng chuyên môn phù hợp với vị trí'];
    const weaknesses = Array.isArray(parsed.weaknesses)
      ? parsed.weaknesses.map(String)
      : ['Cần phỏng vấn thêm để đánh giá năng lực thực tế'];

    const summary = typeof parsed.summary === 'string' && parsed.summary.trim()
      ? parsed.summary.trim()
      : 'Hồ sơ đã được phân tích bằng mô hình AI nội bộ.';

    const experienceYears = typeof parsed.experienceYears === 'number' && parsed.experienceYears >= 0
      ? parsed.experienceYears
      : undefined;

    return {
      aiScore,
      recommendation,
      experienceYears,
      extractedSkills,
      matchedSkills,
      missingSkills,
      strengths,
      weaknesses,
      summary,
      modelUsed: this.modelName,
      rawAnalysis: parsed,
    };
  }
}
