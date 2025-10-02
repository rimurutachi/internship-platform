import { Router } from 'express';
import * as documentController from '../controllers/documentController';

const router = Router();

// Document CRUD
router.post('/', documentController.createDocument);
router.get('/:id', documentController.getDocument);
router.put('/:id', documentController.updateDocument);
router.delete('/:id', documentController.deleteDocument);

// Version control
router.get('/:id/versions', documentController.getVersions);
router.post('/:id/versions', documentController.createVersion);

export default router;