import {
  AiCandidateRecommendation,
  InternshipJobInfo,
} from '../api/types';
import { AiAnalysisResult, AiProvider } from './base.provider';

export class MockAiProvider implements AiProvider {
  readonly name = 'Mock-Heuristic-AI';
  readonly modelName = 'mock-heuristic-v1';

  // Danh mục từ khóa kỹ năng thông dụng để bóc tách từ CV
  private static readonly COMMON_TECH_SKILLS = [
    'JavaScript', 'TypeScript', 'NodeJS', 'Node.js', 'NestJS', 'Express',
    'React', 'ReactJS', 'NextJS', 'Next.js', 'Vue', 'VueJS', 'Angular',
    'HTML', 'CSS', 'Tailwind', 'Sass', 'Bootstrap',
    'Python', 'Django', 'FastAPI', 'Flask',
    'Java', 'Spring', 'Spring Boot', 'C#', '.NET', 'ASP.NET',
    'C++', 'Golang', 'Rust', 'PHP', 'Laravel',
    'PostgreSQL', 'MySQL', 'SQL Server', 'MongoDB', 'Redis', 'SQLite',
    'Prisma', 'TypeORM', 'Hibernate',
    'Docker', 'Kubernetes', 'CI/CD', 'Git', 'GitHub', 'GitLab',
    'AWS', 'Azure', 'GCP', 'Linux', 'RESTful API', 'GraphQL', 'Microservices',
    'Unit Testing', 'Jest', 'Agile', 'Scrum',
  ];

  async analyze(cvText: string, jobInfo: InternshipJobInfo): Promise<AiAnalysisResult> {
    // Giả lập độ trễ suy nghĩ của mô hình AI (1.2s)
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const lowerCv = cvText.toLowerCase();

    // 1. Bóc tách kỹ năng xuất hiện trong CV
    const extractedSkillsSet = new Set<string>();
    for (const skill of MockAiProvider.COMMON_TECH_SKILLS) {
      const escaped = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, 'i');
      if (regex.test(lowerCv)) {
        extractedSkillsSet.add(skill);
      }
    }

    // 2. Đối chiếu với yêu cầu của tin tuyển dụng
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];
    let earnedWeight = 0;
    let totalWeight = 0;

    for (const req of jobInfo.requiredSkills) {
      const weight = Math.max(1, req.weight || 1);
      totalWeight += weight;

      const escaped = req.name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, 'i');
      const hasSkill = regex.test(lowerCv) || Array.from(extractedSkillsSet).some(
        (s) => s.toLowerCase() === req.name.toLowerCase()
      );

      if (hasSkill) {
        matchedSkills.push(req.name);
        earnedWeight += weight;
        extractedSkillsSet.add(req.name);
      } else {
        missingSkills.push(req.name);
      }
    }

    // 3. Tính điểm AI
    let baseScore = 50;
    if (totalWeight > 0) {
      baseScore = Math.round((earnedWeight / totalWeight) * 55) + 35; // Thang 35 - 90
    }

    // Thưởng điểm nếu CV có nội dung dự án / kinh nghiệm
    if (lowerCv.includes('dự án') || lowerCv.includes('project')) baseScore += 5;
    if (lowerCv.includes('kinh nghiệm') || lowerCv.includes('experience')) baseScore += 3;
    if (lowerCv.includes('github') || lowerCv.includes('gitlab')) baseScore += 2;

    const aiScore = Math.min(98, Math.max(25, baseScore));

    // 4. Quyết định Khuyến nghị tuyển dụng
    let recommendation: AiCandidateRecommendation;
    if (aiScore >= 85) {
      recommendation = 'STRONG_HIRE';
    } else if (aiScore >= 70) {
      recommendation = 'HIRE';
    } else if (aiScore >= 50) {
      recommendation = 'POTENTIAL';
    } else {
      recommendation = 'NOT_RECOMMENDED';
    }

    // 5. Ước tính số năm kinh nghiệm dựa trên phân tích text
    let experienceYears: number | undefined;
    const expMatch = lowerCv.match(/(\d+([\.,]\d+)?)\s*(năm|year|yrs)/i);
    if (expMatch && expMatch[1]) {
      const parsedExp = parseFloat(expMatch[1].replace(',', '.'));
      if (!isNaN(parsedExp) && parsedExp > 0 && parsedExp <= 10) {
        experienceYears = parsedExp;
      }
    }

    // 6. Điểm mạnh
    const strengths: string[] = [];
    if (matchedSkills.length > 0) {
      strengths.push(`Nắm vững các kỹ năng cốt lõi: ${matchedSkills.slice(0, 4).join(', ')}.`);
    }
    if (lowerCv.includes('github.com') || lowerCv.includes('gitlab.com')) {
      strengths.push('Có đính kèm liên kết mã nguồn dự án thực tế trên Git.');
    }
    if (lowerCv.includes('gpa') || lowerCv.includes('học lực')) {
      strengths.push('Hồ sơ học tập và thành tích học vấn được thể hiện rõ ràng.');
    }
    if (strengths.length === 0) {
      strengths.push('Hồ sơ trình bày mạch lạc, cấu trúc thông tin rõ ràng.');
    }

    // 7. Điểm cần lưu ý
    const weaknesses: string[] = [];
    if (missingSkills.length > 0) {
      weaknesses.push(`Chưa thể hiện rõ kinh nghiệm đối với: ${missingSkills.slice(0, 3).join(', ')}.`);
    }
    if (!experienceYears || experienceYears < 1) {
      weaknesses.push('Kinh nghiệm làm việc thực tế còn ở mức khởi đầu, cần đào tạo thêm quy trình.');
    }
    if (weaknesses.length === 0) {
      weaknesses.push('Cần phỏng vấn chuyên sâu để đánh giá khả năng giải quyết vấn đề thực tế.');
    }

    // 8. Tóm tắt tổng quan
    const extractedSkillsList = Array.from(extractedSkillsSet);
    const summary = `Ứng viên đáp ứng ${Math.round((matchedSkills.length / Math.max(1, jobInfo.requiredSkills.length)) * 100)}% yêu cầu kỹ thuật của vị trí "${jobInfo.title}". Nền tảng chuyên môn nổi bật với ${matchedSkills.slice(0, 3).join(', ') || 'các kỹ năng cơ bản'}. ${
      recommendation === 'STRONG_HIRE' || recommendation === 'HIRE'
        ? 'Phù hợp để mời tham gia vòng phỏng vấn chuyên môn.'
        : 'Cần cân nhắc thêm dựa trên nhu cầu đào tạo của dự án.'
    }`;

    return {
      aiScore,
      recommendation,
      experienceYears,
      extractedSkills: extractedSkillsList.slice(0, 20),
      matchedSkills,
      missingSkills,
      strengths,
      weaknesses,
      summary,
      modelUsed: this.modelName,
      rawAnalysis: {
        mode: 'mock_heuristic',
        analyzedAt: new Date().toISOString(),
        earnedWeight,
        totalWeight,
      },
    };
  }
}
