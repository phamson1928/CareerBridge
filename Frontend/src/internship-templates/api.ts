import { api } from "../auth/api";
import type { ApiSuccess } from "../auth/auth.types";
import type { InternshipRecord, InternshipStatus } from "../internships/api";

export interface InternshipTemplateSkill {
  skillId: string;
  name: string;
  isRequired: boolean;
  weight: number;
}

export interface InternshipTemplateRecord {
  id: string;
  companyId: string;
  name: string;
  title: string;
  department: string | null;
  location: string | null;
  workType: string | null;
  stipend: string | null;
  description: string;
  requirements: string | null;
  slotsDefault: number;
  skills: InternshipTemplateSkill[];
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInternshipTemplateInput {
  name: string;
  title: string;
  department?: string | null;
  location?: string | null;
  workType?: string | null;
  stipend?: string | null;
  description: string;
  requirements?: string | null;
  slotsDefault?: number;
  skills?: Array<{ skillId: string; isRequired?: boolean; weight?: number }>;
}

export type UpdateInternshipTemplateInput = Partial<CreateInternshipTemplateInput>;

export interface CreateInternshipFromTemplateInput {
  semesterId: string;
  title?: string;
  department?: string | null;
  location?: string | null;
  workType?: string | null;
  stipend?: string | null;
  description?: string;
  requirements?: string | null;
  slots?: number;
  deadline?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: InternshipStatus;
  skills?: Array<{ skillId: string; isRequired?: boolean; weight?: number }>;
}

export interface InternshipWithWarnings extends InternshipRecord {
  warnings?: string[];
}

export const internshipTemplatesApi = {
  listMine: async () => {
    const response = await api.get<ApiSuccess<InternshipTemplateRecord[]>>(
      "/internship-templates/me",
    );
    return response.data.data;
  },
  get: async (id: string) => {
    const response = await api.get<ApiSuccess<InternshipTemplateRecord>>(
      `/internship-templates/${id}`,
    );
    return response.data.data;
  },
  create: async (input: CreateInternshipTemplateInput) => {
    const response = await api.post<ApiSuccess<InternshipTemplateRecord>>(
      "/internship-templates",
      input,
    );
    return response.data.data;
  },
  update: async (id: string, input: UpdateInternshipTemplateInput) => {
    const response = await api.patch<ApiSuccess<InternshipTemplateRecord>>(
      `/internship-templates/${id}`,
      input,
    );
    return response.data.data;
  },
  remove: async (id: string) => {
    const response = await api.delete<ApiSuccess<{ deleted: boolean; id: string }>>(
      `/internship-templates/${id}`,
    );
    return response.data.data;
  },
  createInternship: async (
    id: string,
    input: CreateInternshipFromTemplateInput,
  ) => {
    const response = await api.post<ApiSuccess<InternshipWithWarnings>>(
      `/internship-templates/${id}/create-internship`,
      input,
    );
    return response.data.data;
  },
};
