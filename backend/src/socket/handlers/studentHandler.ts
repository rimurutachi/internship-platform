import { Server, Socket } from 'socket.io';
import { createClient } from '@supabase/supabase-js';

// Lazy initialization of Supabase client
let supabase: any = null;

const getSupabaseClient = () => {
  if (!supabase) {
    supabase = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_SERVICE_KEY as string
    );
  }
  return supabase;
};

/**
 * Student-specific Socket.io event handlers
 */
export const setupStudentHandlers = (io: Server, socket: Socket) => {
  console.log(`Student connected: ${socket.id}`);

  /**
   * Join student's personal room for notifications
   */
  socket.on('student:join', async (userId: string) => {
    try {
      socket.join(`user:${userId}`);
      socket.data.userId = userId;
      console.log(`Student ${userId} joined their room`);
      
      // Send confirmation
      socket.emit('student:joined', {
        success: true,
        message: 'Connected to student notifications',
      });
    } catch (error) {
      console.error('Error joining student room:', error);
      socket.emit('error', { message: 'Failed to join student room' });
    }
  });

  /**
   * Join internship room for internship-specific updates
   */
  socket.on('student:join-internship', async (internshipId: string) => {
    try {
      socket.join(`internship:${internshipId}`);
      console.log(`Student joined internship room: ${internshipId}`);
      
      socket.emit('student:internship-joined', {
        success: true,
        internshipId,
      });
    } catch (error) {
      console.error('Error joining internship room:', error);
      socket.emit('error', { message: 'Failed to join internship room' });
    }
  });

  /**
   * Join conversation room for real-time messaging
   */
  socket.on('student:join-conversation', async (conversationId: string) => {
    try {
      socket.join(`conversation:${conversationId}`);
      console.log(`Student joined conversation: ${conversationId}`);
      
      socket.emit('student:conversation-joined', {
        success: true,
        conversationId,
      });
    } catch (error) {
      console.error('Error joining conversation room:', error);
      socket.emit('error', { message: 'Failed to join conversation' });
    }
  });

  /**
   * Leave conversation room
   */
  socket.on('student:leave-conversation', (conversationId: string) => {
    socket.leave(`conversation:${conversationId}`);
    console.log(`Student left conversation: ${conversationId}`);
  });

  /**
   * Typing indicator
   */
  socket.on('student:typing', async (data: { conversationId: string; isTyping: boolean }) => {
    try {
      const userId = socket.data.userId;
      const supabase = getSupabaseClient();
      
      // Get user info
      const { data: user } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();

      // Broadcast to conversation (except sender)
      socket.to(`conversation:${data.conversationId}`).emit('student:user-typing', {
        conversationId: data.conversationId,
        userId,
        userName: user ? `${user.first_name} ${user.last_name}` : 'Student',
        isTyping: data.isTyping,
      });
    } catch (error) {
      console.error('Error handling typing indicator:', error);
    }
  });

  /**
   * Mark messages as read
   */
  socket.on('student:mark-read', async (data: { conversationId: string; messageIds: string[] }) => {
    try {
      const userId = socket.data.userId;
      const supabase = getSupabaseClient();

      // Update messages in database
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', data.messageIds)
        .neq('sender_id', userId);

      // Broadcast to conversation
      socket.to(`conversation:${data.conversationId}`).emit('student:messages-read', {
        conversationId: data.conversationId,
        messageIds: data.messageIds,
        readBy: userId,
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  /**
   * Request evaluation notifications
   */
  socket.on('student:subscribe-evaluations', (internshipId: string) => {
    socket.join(`evaluation:${internshipId}`);
    console.log(`Student subscribed to evaluation updates for internship: ${internshipId}`);
  });

  /**
   * Request document notifications
   */
  socket.on('student:subscribe-documents', (internshipId: string) => {
    socket.join(`documents:${internshipId}`);
    console.log(`Student subscribed to document updates for internship: ${internshipId}`);
  });

  /**
   * Disconnect handler
   */
  socket.on('disconnect', () => {
    console.log(`Student disconnected: ${socket.id}`);
  });
};

/**
 * Emit functions to be used by controllers/services
 */

/**
 * Notify student of new evaluation
 */
export const notifyStudentEvaluation = (io: Server, userId: string, evaluation: any) => {
  io.to(`user:${userId}`).emit('evaluation:new', {
    type: 'evaluation_received',
    evaluation,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Notify student of evaluation update
 */
export const notifyStudentEvaluationUpdate = (io: Server, userId: string, evaluation: any) => {
  io.to(`user:${userId}`).emit('evaluation:updated', {
    type: 'evaluation_updated',
    evaluation,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Notify student of document status change
 */
export const notifyStudentDocumentUpdate = (
  io: Server,
  userId: string,
  internshipId: string,
  document: any
) => {
  io.to(`user:${userId}`).emit('document:status-changed', {
    type: 'document_status_changed',
    document,
    timestamp: new Date().toISOString(),
  });

  io.to(`documents:${internshipId}`).emit('document:updated', document);
};

/**
 * Notify student of new message
 */
export const notifyStudentMessage = (
  io: Server,
  conversationId: string,
  message: any,
  recipientIds: string[]
) => {
  // Emit to conversation room
  io.to(`conversation:${conversationId}`).emit('message:new', {
    conversationId,
    message,
    timestamp: new Date().toISOString(),
  });

  // Also emit to individual user rooms for push notifications
  recipientIds.forEach((recipientId) => {
    io.to(`user:${recipientId}`).emit('message:notification', {
      conversationId,
      message,
      timestamp: new Date().toISOString(),
    });
  });
};

/**
 * Notify student of general notification
 */
export const notifyStudent = (io: Server, userId: string, notification: any) => {
  io.to(`user:${userId}`).emit('notification:new', {
    notification,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Broadcast internship update to student
 */
export const notifyStudentInternshipUpdate = (
  io: Server,
  internshipId: string,
  userId: string,
  update: any
) => {
  io.to(`internship:${internshipId}`).emit('internship:updated', {
    internshipId,
    update,
    timestamp: new Date().toISOString(),
  });

  io.to(`user:${userId}`).emit('internship:notification', {
    internshipId,
    update,
    timestamp: new Date().toISOString(),
  });
};
