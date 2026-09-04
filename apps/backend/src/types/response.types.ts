// Khung chuẩn cho danh sách (Phân trang)
export interface IApiResponseList<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
}

// Khung chuẩn cho lỗi
export interface IApiError {
    status: number;
    message: string;
}

// Khung dữ liệu User chuẩn
export interface IUserResponse {
    _id: string;
    username: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
}

// Khung dữ liệu Game chuẩn
export interface IGameResponse {
    id: string;
    name: string;
    image: string;
    provider: string;
    category: string;
    order: number;
}
