import { getPage } from '../utils/helpers';

export interface ListWithPagination<T> {
  data: T[];
  pagination?: Pagination;
}

export interface Pagination {
  totalCount: number;
  totalPages: number;
  page: number;
  limit: number;
}

export function getListWithPagination<T>(
  data: T[],
  options?: {
    skip?: number;
    take?: number;
    totalCount?: number;
  }
): ListWithPagination<T> {
  const { skip, take, totalCount } = options || {};

  const result: ListWithPagination<T> = { data };
  if (skip !== undefined && take !== undefined && totalCount !== undefined) {
    result.pagination = getPagination({ skip, take, totalCount });
  }

  return result;
}

export function getPagination(options: {
  skip: number;
  take: number;
  totalCount: number;
}): Pagination {
  const { skip, take, totalCount } = options;
  return {
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / take)),
    page: getPage(skip, take),
    limit: take
  };
}