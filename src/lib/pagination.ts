const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

export interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export function parsePagination(
  searchParams: { page?: string; pageSize?: string },
  defaultSize = DEFAULT_PAGE_SIZE
): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const rawSize = parseInt(searchParams.pageSize ?? String(defaultSize), 10) || defaultSize;
  const pageSize = Math.min(Math.max(1, rawSize), MAX_PAGE_SIZE);

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function paginationMeta(
  params: Pick<PaginationParams, "page" | "pageSize">,
  totalItems: number
): PaginationMeta {
  return {
    page: params.page,
    pageSize: params.pageSize,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / params.pageSize)),
  };
}
