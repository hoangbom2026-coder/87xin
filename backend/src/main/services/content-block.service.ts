import { RootFilterQuery, UpdateQuery } from 'mongoose';
import ContentBlockModel, { IContentBlock } from '@main/models/content-block.model';

export interface ICreateContentBlock {
    key: string;
    value: any;
    description?: string;
    order?: number;
    isVisible?: boolean;
    isMaintenance?: boolean;
}

const createContentBlock = async (data: ICreateContentBlock) => {
    return await ContentBlockModel.create(data);
};

const patchUpdate = async (condition: RootFilterQuery<IContentBlock>, data: UpdateQuery<IContentBlock>) => {
    return await ContentBlockModel.findOneAndUpdate(condition, data, { new: true });
};

const getContentBlockByKey = async (key: string) => {
    return await ContentBlockModel.findOne({ key }).lean();
};

const getContentBlockList = async () => {
    return await ContentBlockModel.find().sort({ order: 1 });
};

const getVisibleContentBlocks = async () => {
    return await ContentBlockModel.find({ isVisible: true }).sort({ order: 1 });
};

const deleteContentBlockById = async (id: string) => {
    return await ContentBlockModel.deleteOne({ _id: id });
};

export default {
    createContentBlock,
    patchUpdate,
    getContentBlockByKey,
    getContentBlockList,
    getVisibleContentBlocks,
    deleteContentBlockById
};
