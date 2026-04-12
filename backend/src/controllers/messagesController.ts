import { Request, Response } from 'express';
import { messageService } from '../services/messageService';

export const getContacts = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id || !user.role) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const contacts = await messageService.getContacts(user.id, user.role);
    res.status(200).json(contacts);
  } catch (error: any) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const contactId = req.params.contactId as string;

    if (!user || !user.id || !user.role) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Verify contactId is a valid contact
    const validContacts = await messageService.getContacts(user.id, user.role);
    const isAllowed = validContacts.some(c => c.id === contactId);
    
    if (!isAllowed) {
       return res.status(403).json({ error: 'You do not have permission to view messages with this user.' });
    }

    const messages = await messageService.getMessages(user.id, contactId);
    res.status(200).json(messages);
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { messageIds } = req.body;
    
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ error: 'messageIds array is required' });
    }

    await messageService.markAsRead(messageIds);
    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
