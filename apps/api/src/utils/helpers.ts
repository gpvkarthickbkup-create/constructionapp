import { Response } from 'express';
import { ApiResponse, PaginatedResponse, PaginationQuery } from '../types';

export function sendSuccess<T>(res: Response, data: T, message?: string, statusCode: number = 200) {
  const response: ApiResponse<T> = { success: true, data, message };
  return res.status(statusCode).json(response);
}

export function sendPaginated<T>(res: Response, result: PaginatedResponse<T>) {
  return res.status(200).json({ success: true, ...result });
}

export function sendError(res: Response, message: string, statusCode: number = 500, errors?: any[]) {
  const response: ApiResponse = { success: false, message, errors };
  return res.status(statusCode).json(response);
}

export function parsePagination(query: any): Required<PaginationQuery> {
  return {
    page: Math.max(1, parseInt(query.page) || 1),
    limit: Math.min(100, Math.max(1, parseInt(query.limit) || 20)),
    sortBy: query.sortBy || 'createdAt',
    sortOrder: query.sortOrder === 'asc' ? 'asc' : 'desc',
    search: query.search || '',
  };
}

export function generateCode(prefix: string, count: number): string {
  return `${prefix}-${String(count + 1).padStart(4, '0')}`;
}

export function generateExpenseNumber(tenantPrefix: string, count: number): string {
  return `${tenantPrefix}-EXP-${String(count + 1).padStart(5, '0')}`;
}
