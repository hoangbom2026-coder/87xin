import express from 'express';
import { createValidator } from 'express-joi-validation';
import auth from '@middlewares/auth';
import adminOnly from '@middlewares/admin-only';
import joiSchema from '@main/validators/site-plugin.joi';
import {
    listSitePlugins,
    getSitePlugin,
    createSitePlugin,
    patchSitePlugin,
    installSitePlugin,
    uninstallSitePlugin
} from '@main/controllers/site-plugin.controller';

const router = express.Router();
const validator = createValidator();

router
    .route('/')
    .get(auth, adminOnly, listSitePlugins)
    .post(auth, adminOnly, validator.body(joiSchema.createSitePlugin), createSitePlugin);

router
    .route('/:pluginId')
    .get(auth, adminOnly, validator.params(joiSchema.pluginIdParam), getSitePlugin)
    .patch(auth, adminOnly, validator.params(joiSchema.pluginIdParam), validator.body(joiSchema.patchSitePlugin), patchSitePlugin);

router.post(
    '/:pluginId/install',
    auth,
    adminOnly,
    validator.params(joiSchema.pluginIdParam),
    installSitePlugin
);

router.post(
    '/:pluginId/uninstall',
    auth,
    adminOnly,
    validator.params(joiSchema.pluginIdParam),
    uninstallSitePlugin
);

export default router;
