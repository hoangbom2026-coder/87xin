import express from 'express';
import auth from '@middlewares/auth';
import adminOnly from '@middlewares/admin-only';
import {
    createCategory,
    createPost,
    deleteCategory,
    deletePost,
    getPostById,
    listCategories,
    listCategoriesPublic,
    listPosts,
    listPostsPublic,
    patchCategory,
    patchPost
} from '@main/controllers/article.controller';

const router = express.Router();

router.get('/public', listPostsPublic);
router.get('/public-categories', listCategoriesPublic);

router.get('/categories', auth, adminOnly, listCategories);
router.post('/categories', auth, adminOnly, createCategory);
router.patch('/categories/:id', auth, adminOnly, patchCategory);
router.delete('/categories/:id', auth, adminOnly, deleteCategory);

router.get('/list', auth, adminOnly, listPosts);
router.get('/:id', auth, adminOnly, getPostById);
router.post('/', auth, adminOnly, createPost);
router.patch('/:id', auth, adminOnly, patchPost);
router.delete('/:id', auth, adminOnly, deletePost);

export default router;
