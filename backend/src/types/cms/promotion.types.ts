export interface ICreatePromotion {
    title: string;
    description: string;
    content: string;
    image: string;
    status: boolean;
    startDate: Date;
    endDate: Date;
}
export interface IPromotion extends ICreatePromotion {
    _id: string;
}
