import RoleModel from '@main/models/role.model';
import {
    SYSTEM_ROLES,
    ALL_PERMISSION_KEY_SET,
    PERMISSION_GROUPS
} from '@main/constants/permissions-catalog';

const slugify = (s: string) =>
    s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

const ensureUniqueSlug = async (base: string, excludeId?: string): Promise<string> => {
    const root = slugify(base) || `role_${Date.now()}`;
    let candidate = root;
    let i = 2;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const exist = await RoleModel.findOne({
            slug: candidate,
            ...(excludeId ? { _id: { $ne: excludeId } } : {})
        }).lean();
        if (!exist) return candidate;
        candidate = `${root}_${i++}`;
    }
};

/** Idempotent: tạo system role nếu chưa tồn tại. */
export async function seedSystemRoles() {
    for (const def of SYSTEM_ROLES) {
        const exist = await RoleModel.findOne({ slug: def.slug });
        if (!exist) {
            await RoleModel.create({
                slug: def.slug,
                name: def.name,
                description: def.description,
                permissions: def.permissions,
                isSystem: def.locked
            });
        } else if (def.locked) {
            // đảm bảo Owner/Administrator luôn full quyền & isSystem=true
            const merged = Array.from(new Set([...(exist.permissions ?? []), ...def.permissions]));
            exist.permissions = merged;
            exist.isSystem = true;
            if (!exist.name) exist.name = def.name;
            if (!exist.description) exist.description = def.description;
            await exist.save();
        }
    }
}

export function sanitizePermissions(perms: unknown): string[] {
    if (!Array.isArray(perms)) return [];
    const set = new Set<string>();
    for (const p of perms) {
        const s = String(p).trim();
        if (ALL_PERMISSION_KEY_SET.has(s)) set.add(s);
    }
    return Array.from(set);
}

export async function listRoles() {
    return await RoleModel.find().sort({ isSystem: -1, name: 1 }).lean();
}

export async function getRoleById(id: string) {
    return await RoleModel.findById(id).lean();
}

export async function createRole(payload: {
    name: string;
    description?: string;
    permissions?: string[];
    cloneFromId?: string;
}) {
    const name = (payload.name || '').trim();
    if (!name) throw new Error('Name required');
    let perms = sanitizePermissions(payload.permissions);
    if (payload.cloneFromId) {
        const src = await RoleModel.findById(payload.cloneFromId).lean();
        if (src) perms = Array.from(new Set([...perms, ...(src.permissions ?? [])]));
    }
    const slug = await ensureUniqueSlug(name);
    return await RoleModel.create({
        slug,
        name,
        description: payload.description ?? '',
        permissions: perms,
        isSystem: false
    });
}

export async function updateRole(
    id: string,
    payload: { name?: string; description?: string; permissions?: string[] }
) {
    const cur = await RoleModel.findById(id);
    if (!cur) throw new Error('Role not found');
    if (cur.isSystem) {
        throw new Error('System role không thể chỉnh sửa');
    }
    if (payload.name !== undefined) cur.name = payload.name.trim() || cur.name;
    if (payload.description !== undefined) cur.description = payload.description;
    if (payload.permissions !== undefined) cur.permissions = sanitizePermissions(payload.permissions);
    await cur.save();
    return cur;
}

export async function deleteRole(id: string) {
    const cur = await RoleModel.findById(id);
    if (!cur) return { ok: true };
    if (cur.isSystem) throw new Error('System role không thể xóa');
    await RoleModel.deleteOne({ _id: id });
    return { ok: true };
}

export function getPermissionCatalog() {
    return PERMISSION_GROUPS;
}
