export interface ICreateBanner {
    image: string;
    order: number;
    status?: boolean;
    link?: string;
}

export interface IBanner extends ICreateBanner {
    _id: string;
}
