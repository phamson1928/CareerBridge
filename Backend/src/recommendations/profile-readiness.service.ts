import { Injectable } from '@nestjs/common';
import {
  ProfileReadiness,
  RecommendationStudent,
} from './types/recommendation.types';

@Injectable()
export class ProfileReadinessService {
  calculate(student: RecommendationStudent): ProfileReadiness {
    const hasSummary = Boolean(student.summary?.trim());
    const skillScore =
      student.skills.length >= 3
        ? 35
        : student.skills.length === 2
          ? 25
          : student.skills.length === 1
            ? 15
            : 0;
    const hasProjectEvidence = student.projects.some((project) =>
      Boolean(project.description?.trim()),
    );
    const hasRoles = student.preferences.desiredRoles.length > 0;
    const hasLocations = student.preferences.preferredLocations.length > 0;
    const hasWorkTypes = student.preferences.preferredWorkTypes.length > 0;
    const score =
      (hasSummary ? 20 : 0) +
      skillScore +
      (hasProjectEvidence ? 20 : 0) +
      (hasRoles ? 10 : 0) +
      (hasLocations ? 7.5 : 0) +
      (hasWorkTypes ? 7.5 : 0);
    const missingFields: ProfileReadiness['missingFields'] = [];
    if (!hasSummary) missingFields.push('SUMMARY');
    if (!student.skills.length) missingFields.push('SKILLS');
    if (!hasProjectEvidence) missingFields.push('PROJECTS');
    if (!hasRoles) missingFields.push('DESIRED_ROLES');
    if (!hasLocations) missingFields.push('LOCATIONS');
    if (!hasWorkTypes) missingFields.push('WORK_TYPES');
    const roundedScore = Math.round(score);
    return {
      score: roundedScore,
      level:
        roundedScore >= 75 ? 'HIGH' : roundedScore >= 45 ? 'MEDIUM' : 'LOW',
      missingFields,
      canUseAiExplanation: Boolean(
        student.skills.length && (hasSummary || hasProjectEvidence || hasRoles),
      ),
    };
  }
}
