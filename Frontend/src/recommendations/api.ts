import { api } from '../auth/api';
import type { ApiSuccess } from '../auth/auth.types';
import type { RecommendationResponse } from './types';

export const recommendationsApi = {
  getCurrent: async () =>
    (await api.get<ApiSuccess<RecommendationResponse>>('/recommendations/internships/me'))
      .data.data,
  generate: async (force = false) =>
    (
      await api.post<ApiSuccess<RecommendationResponse>>(
        '/recommendations/internships/me/generate',
        { force },
      )
    ).data.data,
};
