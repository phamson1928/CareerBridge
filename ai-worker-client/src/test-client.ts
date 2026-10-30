import fs from 'fs';
import path from 'path';
import os from 'os';
import { MockAiProvider } from './providers/mock.provider';
import { OllamaAiProvider } from './providers/ollama.provider';
import { CvParser } from './pdf/parser';
import { InternshipJobInfo } from './api/types';
import { Logger } from './utils/logger';

async function runTests(): Promise<void> {
  Logger.banner('RUNNING AI WORKER CLIENT INTERNAL TESTS');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, desc: string): void {
    total++;
    if (condition) {
      Logger.success(`[PASS] ${desc}`);
      passed++;
    } else {
      Logger.error(`[FAIL] ${desc}`);
      throw new Error(`Test failed: ${desc}`);
    }
  }

  // TEST 1: MockAiProvider analysis
  const mockProvider = new MockAiProvider();
  const sampleJob: InternshipJobInfo = {
    id: 'test-intern-1',
    title: 'Thực tập sinh Backend NodeJS & NestJS',
    department: 'Engineering',
    description: 'Xây dựng REST API bằng TypeScript, NestJS và PostgreSQL',
    requirements: 'Có kiến thức về TypeScript, cơ sở dữ liệu quan hệ, Docker',
    workType: 'HYBRID',
    requiredSkills: [
      { name: 'TypeScript', isRequired: true, weight: 3 },
      { name: 'NestJS', isRequired: true, weight: 3 },
      { name: 'PostgreSQL', isRequired: true, weight: 2 },
      { name: 'Docker', isRequired: false, weight: 1 },
    ],
  };

  const sampleCvText = `
    NGUYỄN VĂN AN - DEVELOPER
    Email: an.nguyen@example.com | Phone: 0901234567 | Github: github.com/annguyen
    Học vấn: Đại học Bách Khoa, GPA 3.4/4.0
    Kinh nghiệm: 1.5 năm làm việc với dự án web.
    Kỹ năng: TypeScript, JavaScript, NodeJS, NestJS, Express, PostgreSQL, Prisma, Git, HTML, CSS.
    Dự án: Xây dựng hệ thống quản lý bán hàng với NestJS, PostgreSQL và Redis.
  `;

  const analysis = await mockProvider.analyze(sampleCvText, sampleJob);
  assert(analysis.aiScore >= 70, `Mock AI score hợp lệ: ${analysis.aiScore}/100`);
  assert(analysis.recommendation === 'HIRE' || analysis.recommendation === 'STRONG_HIRE', `Recommendation hợp lệ: ${analysis.recommendation}`);
  assert(analysis.matchedSkills.includes('TypeScript'), 'Nhận diện kỹ năng khớp: TypeScript');
  assert(analysis.matchedSkills.includes('NestJS'), 'Nhận diện kỹ năng khớp: NestJS');
  assert(analysis.matchedSkills.includes('PostgreSQL'), 'Nhận diện kỹ năng khớp: PostgreSQL');
  assert(analysis.missingSkills.includes('Docker'), 'Nhận diện kỹ năng thiếu: Docker');
  assert(analysis.strengths.length > 0, 'Sinh điểm mạnh có ý nghĩa');
  assert(analysis.weaknesses.length > 0, 'Sinh điểm cần lưu ý');
  assert(analysis.summary.length > 20, 'Sinh tóm tắt đầy đủ');

  // TEST 2: OllamaAiProvider JSON parsing & markdown stripping
  const ollamaProvider = new OllamaAiProvider('http://localhost:11434', 'test-model');
  const parseResponse = (ollamaProvider as any).parseAndValidateResponse.bind(ollamaProvider);

  const mockOllamaOutput = `
  \`\`\`json
  {
    "aiScore": 88,
    "recommendation": "STRONG_HIRE",
    "experienceYears": 2,
    "extractedSkills": ["TypeScript", "NestJS", "Docker"],
    "matchedSkills": ["TypeScript", "NestJS"],
    "missingSkills": ["PostgreSQL"],
    "strengths": ["Rất giỏi TypeScript", "Kinh nghiệm thực tế tốt"],
    "weaknesses": ["Chưa thạo PostgreSQL"],
    "summary": "Ứng viên rất tiềm năng cho vị trí backend."
  }
  \`\`\`
  `;

  const parsedOllama = parseResponse(mockOllamaOutput);
  assert(parsedOllama.aiScore === 88, 'Ollama parser bóc tách đúng aiScore 88');
  assert(parsedOllama.recommendation === 'STRONG_HIRE', 'Ollama parser bóc tách đúng STRONG_HIRE');
  assert(parsedOllama.matchedSkills.length === 2, 'Ollama parser bóc tách đúng 2 kỹ năng khớp');

  // TEST 3: CvParser guaranteed cleanup
  const tempTestFile = path.join(os.tmpdir(), `test_cleanup_${Date.now()}.txt`);
  await fs.promises.writeFile(tempTestFile, 'dummy content');
  assert(fs.existsSync(tempTestFile), 'Tạo file tạm thành công');

  try {
    await CvParser.extractTextAndCleanup(tempTestFile);
  } catch {
    // pdf-parse có thể báo lỗi định dạng vì đây là file txt, nhưng khối finally BẮT BUỘC phải xóa file
  }
  assert(!fs.existsSync(tempTestFile), 'Khối finally của CvParser BẮT BUỘC xóa sạch file tạm khỏi ổ cứng');

  Logger.success(`\nTOÀN BỘ ${passed}/${total} TESTS CLIENT ĐÃ VƯỢT QUA XUẤT SẮC!`);
}

runTests().catch((err) => {
  Logger.error('Lỗi kiểm thử:', err);
  process.exit(1);
});
