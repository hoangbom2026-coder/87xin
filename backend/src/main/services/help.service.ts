// model
import HelpModel, { IHelp } from '@main/models/help.model';

export interface ICreateHelp {
    slug: string;
    title: string;
    lang: string;
    content: string;
}

const createHelp = async (newSession: ICreateHelp) => {
    return await HelpModel.create(newSession);
};

const getHelp = async (slug: string, lang: string) => {
    return HelpModel.findOne({ slug, lang, status: true });
};

const getHelps = async (lang: string) => {
    return HelpModel.find({ lang, status: true });
};

const getHelpList = async () => {
    return HelpModel.find();
};

const updateHelp = async (id: string, updateData: Partial<IHelp>) => {
    return await HelpModel.updateOne({ _id: id }, updateData, { upsert: true });
};

const deleteHelp = async (slug: string) => {
    return await HelpModel.deleteMany({ slug });
};

export default {
    createHelp,
    getHelp,
    getHelps,
    getHelpList,
    deleteHelp,
    updateHelp
};
