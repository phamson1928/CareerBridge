import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT ?? 5173);
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    process.argv[1]?.replaceAll('\\', '/').includes('/dist/') === true;

  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini API client on server side safely
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // AI CV Analyzer Endpoint
  app.post('/api/ai/analyze-cv', async (req, res) => {
    try {
      const { cvText, studentMajor, targetSkills } = req.body;
      const ai = getGeminiClient();

      const prompt = `
Bạn là chuyên gia cố vấn nghề nghiệp và tuyển dụng IT hàng đầu tại Việt Nam.
Hãy phân tích hồ sơ/CV của sinh viên với thông tin sau:
- Ngành học: ${studentMajor || 'Software Engineering'}
- Kỹ năng hiện có: ${Array.isArray(targetSkills) ? targetSkills.join(', ') : targetSkills || 'Mới tốt nghiệp'}
- Nội dung CV/Tóm tắt:
${cvText || 'Sinh viên chưa cập nhật tóm tắt chi tiết'}

Hãy đưa ra phản hồi bằng Tiếng Việt theo định dạng JSON với cấu trúc:
{
  "summaryRating": "Xuất sắc" | "Khá tốt" | "Cần cải thiện",
  "overallScore": number (từ 1 đến 10),
  "strengths": string[],
  "improvements": string[],
  "recommendedRoles": string[],
  "careerAdvice": string
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summaryRating: { type: Type.STRING },
              overallScore: { type: Type.NUMBER },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              improvements: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              recommendedRoles: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              careerAdvice: { type: Type.STRING },
            },
            required: ['summaryRating', 'overallScore', 'strengths', 'improvements', 'recommendedRoles', 'careerAdvice'],
          },
        },
      });

      const resultText = response.text || '{}';
      res.json(JSON.parse(resultText));
    } catch (error: any) {
      console.error('Error in analyze-cv:', error);
      res.status(500).json({
        error: 'Phân tích CV thất bại',
        details: error?.message || 'Vui lòng kiểm tra lại GEMINI_API_KEY.',
      });
    }
  });

  // AI Smart Internship Recommendations Endpoint
  app.post('/api/ai/suggest-internships', async (req, res) => {
    try {
      const { studentProfile, internships } = req.body;
      const ai = getGeminiClient();

      const prompt = `
Dựa vào thông tin hồ sơ sinh viên:
- Tên: ${studentProfile?.fullname}
- Ngành: ${studentProfile?.major}
- Kỹ năng: ${studentProfile?.skills?.join(', ')}

Và danh sách vị trí thực tập:
${JSON.stringify(internships)}

Hãy phân tích và gợi ý các vị trí phù hợp nhất, giải thích lý do tại sao sinh viên nên ứng tuyển.
Trả về định dạng JSON:
{
  "recommendations": [
    {
      "internshipId": string,
      "matchScore": number (1-100),
      "reason": string,
      "keySkillHighlights": string[]
    }
  ],
  "overallInsight": string
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    internshipId: { type: Type.STRING },
                    matchScore: { type: Type.NUMBER },
                    reason: { type: Type.STRING },
                    keySkillHighlights: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                  },
                  required: ['internshipId', 'matchScore', 'reason', 'keySkillHighlights'],
                },
              },
              overallInsight: { type: Type.STRING },
            },
            required: ['recommendations', 'overallInsight'],
          },
        },
      });

      const resultText = response.text || '{}';
      res.json(JSON.parse(resultText));
    } catch (error: any) {
      console.error('Error in suggest-internships:', error);
      res.status(500).json({
        error: 'Gợi ý thực tập thất bại',
        details: error?.message || 'Đã xảy ra lỗi khi gọi AI Service.',
      });
    }
  });

  // Vite middleware for development
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
