import { Injectable, NotFoundException } from '@nestjs/common';
import {
  InternshipStatus,
  PlacementStatus,
  Prisma,
  SemesterStatus,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SemesterLifecycleService } from '../semesters/semester-lifecycle.service';
import {
  RecommendationCandidate,
  RecommendationStudent,
} from './types/recommendation.types';

const studentSelect = {
  id: true,
  major: true,
  majorId: true,
  majorRef: {
    select: {
      id: true,
      code: true,
      name: true,
      facultyId: true,
      faculty: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
  },
  summary: true,
  skills: {
    select: { skillId: true, level: true, skill: { select: { name: true } } },
  },
  projects: {
    select: { id: true, title: true, description: true, updatedAt: true },
  },
  jobPreference: {
    select: {
      desiredRoles: true,
      preferredLocations: true,
      preferredWorkTypes: true,
    },
  },
} satisfies Prisma.StudentProfileSelect;

const candidateSelect = {
  id: true,
  companyId: true,
  semesterId: true,
  title: true,
  department: true,
  location: true,
  workType: true,
  stipend: true,
  description: true,
  requirements: true,
  deadline: true,
  startDate: true,
  endDate: true,
  slots: true,
  filledSlots: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  skills: {
    select: {
      skillId: true,
      isRequired: true,
      weight: true,
      skill: { select: { name: true } },
    },
  },
  majors: {
    select: {
      majorId: true,
      major: {
        select: {
          id: true,
          code: true,
          name: true,
          facultyId: true,
          faculty: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      },
    },
  },
  company: {
    select: { id: true, companyName: true, logo: true, status: true },
  },
  semester: {
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      status: true,
    },
  },
} satisfies Prisma.InternshipSelect;

@Injectable()
export class RecommendationCandidatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lifecycle: SemesterLifecycleService,
  ) {}

  async loadForUser(userId: string): Promise<{
    student: RecommendationStudent;
    candidates: RecommendationCandidate[];
  }> {
    await this.lifecycle.reconcile();
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
      select: studentSelect,
    });
    if (!student)
      throw new NotFoundException({
        code: 'STUDENT_PROFILE_NOT_FOUND',
        message: 'Student profile not found',
      });

    const now = new Date();
    const internships = await this.prisma.internship.findMany({
      where: {
        status: InternshipStatus.OPEN,
        AND: [
          { OR: [{ deadline: null }, { deadline: { gt: now } }] },
          { company: { status: 'APPROVED', user: { status: 'ACTIVE' } } },
          {
            semester: {
              status: SemesterStatus.RECRUITING,
              placements: {
                none: {
                  studentId: student.id,
                  status: {
                    in: [PlacementStatus.PENDING, PlacementStatus.ACTIVE],
                  },
                },
              },
            },
          },
          { applications: { none: { studentId: student.id } } },
        ],
      },
      select: candidateSelect,
    });

    return {
      student: {
        id: student.id,
        major: student.majorRef?.name ?? student.major,
        majorId: student.majorId ?? null,
        majorCode: student.majorRef?.code ?? null,
        facultyId: student.majorRef?.facultyId ?? null,
        facultyCode: student.majorRef?.faculty?.code ?? null,
        facultyName: student.majorRef?.faculty?.name ?? null,
        summary: student.summary,
        skills: student.skills.map(({ skill, ...item }) => ({
          ...item,
          name: skill.name,
        })),
        projects: student.projects,
        preferences: student.jobPreference ?? {
          desiredRoles: [],
          preferredLocations: [],
          preferredWorkTypes: [],
        },
      },
      candidates: internships
        .filter((internship) => internship.filledSlots < internship.slots)
        .map(({ skills, majors, ...internship }) => ({
          ...internship,
          skills: skills.map(({ skill, ...item }) => ({
            ...item,
            name: skill.name,
          })),
          majors: (majors ?? []).map(({ major }) => ({
            majorId: major.id,
            id: major.id,
            code: major.code,
            name: major.name,
            facultyId: major.facultyId,
            faculty: major.faculty,
          })),
        })),
    };
  }
}
