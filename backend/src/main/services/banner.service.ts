// model
import { RootFilterQuery, UpdateQuery } from 'mongoose';
import BannerModel, { IBanner as IBannerModel } from '@main/models/banner.model';
import { ICreateBanner, IBanner } from '../../types/cms/banner.types';

const createBanner = async (data: ICreateBanner) => {
    return await BannerModel.create(data);
};

const patchUpdate = async (condition: any, data: any) => {
    return await BannerModel.findOneAndUpdate(condition, data, { new: true });
};

const getBannerById = async (id: string) => {
    return await BannerModel.findOne({ _id: id }).lean();
};

const getBannerList = async () => {
    return await BannerModel.find().sort('order');
};

const getBanners = async () => {
    return await BannerModel.find({ status: true }, { image: 1, order: 1, link: 1 }).sort('order');
};

const deleteBannerById = async (id: string) => {
    return await BannerModel.deleteOne({ _id: id });
};

export default {
    getBanners,
    createBanner,
    getBannerList,
    getBannerById,
    patchUpdate,
    deleteBannerById
};
