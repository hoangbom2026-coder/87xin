import path from 'path';
import fs from 'fs';
import express from 'express';

const router = express.Router();

router.get('*', (req, res) => {
    const indexPath = path.join(__dirname, '../public/frontend/index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(200).send('API is running. Frontend static files not found.');
    }
});

export default router;
