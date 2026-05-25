export interface ICreateContentBlock {
    key: string;
    value: string;
    description?: string;
}

export interface IContentBlock extends ICreateContentBlock {
    _id: string;
}
