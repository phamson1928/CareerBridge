import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { calculateSkillMatch } from './skill-match.calculator';

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

    const result = calculateSkillMatch(
      student.skills,
      internship.skills.map(({ skill, ...requirement }) => ({
        ...requirement,
        name: skill.name,
      })),
    );

    return {
      internshipId,
      studentId: student.id,
      ...result,
    };
  }
}
