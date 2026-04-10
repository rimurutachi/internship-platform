import express from 'express';
import { getContacts, getMessages, markAsRead } from '../controllers/messagesController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

router.get('/contacts', getContacts);
router.get('/:contactId', getMessages);
router.post('/read', markAsRead);

export default router;
