export interface PaginationParams {
  page?: number;
  limit?: number;
}

export function resolvePagination(params: PaginationParams) {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(50, Math.max(1, params.limit ?? 12));
  const skip = (page - 1) * limit;

  return { page, limit, skip, take: limit };
}

export function buildMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}
