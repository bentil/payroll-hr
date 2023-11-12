import { Pagination } from '../repositories/types';

export interface ApiSuccessResponse<T> {
    data: T;
    pagination?: Pagination;
}

export interface ApiErrorResponse {
    /**
     * @description Error tag
     * @example NOT_FOUND
     */
    error: string;
    /**
     * @description Detailed error message
     * @example Resource request could not be found
     */
    message: string;

    /**
     * @description List of individual errors, if there are multiple errors
     */
    details?: unknown[];
}