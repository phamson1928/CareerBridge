import { SkillLevel } from '../generated/prisma/client';

export type StudentSkillForMatch = {
  skillId: string;
  level: SkillLevel;
  name?: string;
};

export type InternshipSkillForMatch = {
  skillId: string;
  isRequired: boolean;
  weight: number;
  name: string;
};

export type SkillMatchDetail = InternshipSkillForMatch & {
  studentLevel: SkillLevel | null;
  earnedWeight: number;
  matched: boolean;
};

export type SkillMatchResult = {
  hasRequirements: boolean;
  matchedWeight: number;
  totalWeight: number;
  percentage: number | null;
  missingRequiredSkills: Array<{ skillId: string; name: string }>;
  meetsRequiredSkills: boolean;
  skills: SkillMatchDetail[];
};

export const SKILL_LEVEL_FACTORS: Record<SkillLevel, number> = {
  BEGINNER: 0.25,
  INTERMEDIATE: 0.5,
  ADVANCED: 0.75,
  EXPERT: 1,
};

export function calculateSkillMatch(
  studentSkills: readonly StudentSkillForMatch[],
  requirements: readonly InternshipSkillForMatch[],
): SkillMatchResult {
  const skillsById = new Map(
    studentSkills.map((skill) => [skill.skillId, skill]),
  );
  const totalWeight = requirements.reduce(
    (sum, requirement) => sum + requirement.weight,
    0,
  );
  const skills = requirements.map((requirement) => {
    const studentSkill = skillsById.get(requirement.skillId);
    const factor = studentSkill ? SKILL_LEVEL_FACTORS[studentSkill.level] : 0;
    return {
      ...requirement,
      studentLevel: studentSkill?.level ?? null,
      earnedWeight: requirement.weight * factor,
      matched: Boolean(studentSkill),
    };
  });
  const matchedWeight = skills.reduce(
    (sum, skill) => sum + skill.earnedWeight,
    0,
  );
  const missingRequiredSkills = skills
    .filter((skill) => skill.isRequired && !skill.matched)
    .map(({ skillId, name }) => ({ skillId, name }));

  return {
    hasRequirements: requirements.length > 0,
    matchedWeight,
    totalWeight,
    percentage:
      totalWeight === 0
        ? null
        : Math.round((matchedWeight / totalWeight) * 100),
    missingRequiredSkills,
    meetsRequiredSkills: missingRequiredSkills.length === 0,
    skills,
  };
}
