import { IPackage, PackageModel } from '@main/models/packages.model';
import PackageCategoryModel, { IPackageCategory } from '@main/models/package-category.model';

export const packageService = {
    async getAll(filter?: { page?: number; limit?: number }): Promise<{
        items: IPackage[];
        total: number;
        page: number;
        limit: number;
    }> {
        const page = Math.max(1, Number(filter?.page || 1));
        const limit = Math.max(1, Math.min(200, Number(filter?.limit || 100)));
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            PackageModel.find().sort({ price: 1 }).skip(skip).limit(limit),
            PackageModel.countDocuments({})
        ]);
        return { items, total, page, limit };
    },

    async getById(id: string): Promise<IPackage | null> {
        return PackageModel.findById(id);
    },

    async create(data: Partial<IPackage>): Promise<IPackage> {
        const pkg = new PackageModel(data);
        return pkg.save();
    },

    async update(id: string, data: Partial<IPackage>): Promise<IPackage | null> {
        return PackageModel.findByIdAndUpdate(id, data, { new: true });
    },

    async remove(id: string): Promise<IPackage | null> {
        return PackageModel.findByIdAndDelete(id);
    },

    async listCategories(): Promise<IPackageCategory[]> {
        return PackageCategoryModel.find().sort({ order: 1, createdAt: -1 });
    },

    async createCategory(data: Partial<IPackageCategory>): Promise<IPackageCategory> {
        return PackageCategoryModel.create(data);
    }
};
