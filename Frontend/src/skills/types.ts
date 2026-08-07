export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export interface SkillRecord {
  id: string;
  name: string;
  studentCount: number;
  internshipCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SkillsPage {
  items: SkillRecord[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface StudentSkillRecord {
  skillId: string;
  name: string;
  level: SkillLevel;
}

export interface InternshipSkillRecord {
  skillId: string;
  name: string;
  isRequired: boolean;
  weight: number;
}

export interface SkillMatchResult {
  internshipId: string;
  studentId: string;
  matchedWeight: number;
  totalWeight: number;
  percentage: number;
  skills: Array<StudentSkillRecord & { isRequired: boolean; weight: number; studentLevel: SkillLevel | null; earnedWeight: number; matched: boolean }>;
}
