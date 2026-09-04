/**
 * Centralized TypeScript contracts and API response interfaces for TC-Gaming Monorepo.
 */

// Standard API single response
export interface IApiResponse<T = unknown> {
    success: boolean;
    data: T;
    message?: string;
}

// Standard API paginated list response
export interface IApiResponseList<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
}

// Standard API error response
export interface IApiError {
    status: number;
    message: string;
}

// Core User data contract
export interface IUserResponse {
    _id: string;
    username: string;
    email?: string;
    role?: string;
    status?: string;
    createdAt?: string | Date;
}

// Core Game catalog contract
export interface IGameResponse {
    id: string;
    name: string;
    image: string;
    provider: string;
    category: string;
    order: number;
}
