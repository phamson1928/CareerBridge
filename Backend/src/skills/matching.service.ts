import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SkillLevel } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const levelFactors: Record<SkillLevel, number> = {
  BEGINNER: 0.25,
  INTERMEDIATE: 0.5,
  ADVANCED: 0.75,
  EXPERT: 1,
};

const matchingStudentSelect = {
  id: true,
  skills: {
    select: {
      skillId: true,
      level: true,
      skill: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.StudentProfileSelect;

const matchingInternshipSelect = {
  id: true,
  skills: {
    select: {
      skillId: true,
      isRequired: true,
      weight: true,
      skill: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.InternshipSelect;

@Injectable()
export class MatchingService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateForUser(userId: string, internshipId: string) {
    const [student, internship] = await Promise.all([
      this.prisma.studentProfile.findUnique({
        where: { userId },
        select: matchingStudentSelect,
      }),
      this.prisma.internship.findUnique({
        where: { id: internshipId },
        select: matchingInternshipSelect,
      }),
    ]);

    if (!student) {
      throw new NotFoundException({
        code: 'STUDENT_PROFILE_NOT_FOUND',
        message: 'Student profile not found',
      });
    }
    if (!internship) {
      throw new NotFoundException({
        code: 'INTERNSHIP_NOT_FOUND',
        message: 'Internship not found',
      });
    }

    const studentSkills = new Map(
      student.skills.map((item) => [item.skillId, item]),
    );
    const totalWeight = internship.skills.reduce(
      (sum, item) => sum + item.weight,
      0,
    );
    const skills = internship.skills.map((requirement) => {
      const studentSkill = studentSkills.get(requirement.skillId);
      const factor = studentSkill ? levelFactors[studentSkill.level] : 0;
      const earnedWeight = requirement.weight * factor;
      return {
        skillId: requirement.skillId,
        name: requirement.skill.name,
        isRequired: requirement.isRequired,
        weight: requirement.weight,
        studentLevel: studentSkill?.level ?? null,
        earnedWeight,
        matched: Boolean(studentSkill),
      };
    });
    const matchedWeight = skills.reduce(
      (sum, item) => sum + item.earnedWeight,
      0,
    );
    const missingRequiredSkills = skills
      .filter((item) => item.isRequired && !item.matched)
      .map((item) => ({ skillId: item.skillId, name: item.name }));

    return {
      internshipId,
      studentId: student.id,
      matchedWeight,
      totalWeight,
      percentage:
        totalWeight === 0
          ? 100
          : Math.round((matchedWeight / totalWeight) * 100),
      missingRequiredSkills,
      meetsRequiredSkills: missingRequiredSkills.length === 0,
      skills,
    };
  }
}
