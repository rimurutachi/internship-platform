"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyStudentInternshipUpdate = exports.notifyStudent = exports.notifyStudentMessage = exports.notifyStudentDocumentUpdate = exports.notifyStudentEvaluationUpdate = exports.notifyStudentEvaluation = exports.setupStudentHandlers = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
// Lazy initialization of Supabase client
let supabase = null;
const getSupabaseClient = () => {
    if (!supabase) {
        supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    }
    return supabase;
};
/**
 * Student-specific Socket.io event handlers
 */
const setupStudentHandlers = (io, socket) => {
    console.log(`Student connected: ${socket.id}`);
    /**
     * Join student's personal room for notifications
     */
    socket.on('student:join', async (userId) => {
        try {
            socket.join(`user:${userId}`);
            socket.data.userId = userId;
            console.log(`Student ${userId} joined their room`);
            // Send confirmation
            socket.emit('student:joined', {
                success: true,
                message: 'Connected to student notifications',
            });
        }
        catch (error) {
            console.error('Error joining student room:', error);
            socket.emit('error', { message: 'Failed to join student room' });
        }
    });
    /**
     * Join internship room for internship-specific updates
     */
    socket.on('student:join-internship', async (internshipId) => {
        try {
            socket.join(`internship:${internshipId}`);
            console.log(`Student joined internship room: ${internshipId}`);
            socket.emit('student:internship-joined', {
                success: true,
                internshipId,
            });
        }
        catch (error) {
            console.error('Error joining internship room:', error);
            socket.emit('error', { message: 'Failed to join internship room' });
        }
    });
    /**
     * Join conversation room for real-time messaging
     */
    socket.on('student:join-conversation', async (conversationId) => {
        try {
            socket.join(`conversation:${conversationId}`);
            console.log(`Student joined conversation: ${conversationId}`);
            socket.emit('student:conversation-joined', {
                success: true,
                conversationId,
            });
        }
        catch (error) {
            console.error('Error joining conversation room:', error);
            socket.emit('error', { message: 'Failed to join conversation' });
        }
    });
    /**
     * Leave conversation room
     */
    socket.on('student:leave-conversation', (conversationId) => {
        socket.leave(`conversation:${conversationId}`);
        console.log(`Student left conversation: ${conversationId}`);
    });
    /**
     * Typing indicator
     */
    socket.on('student:typing', async (data) => {
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
        }
        catch (error) {
            console.error('Error handling typing indicator:', error);
        }
    });
    /**
     * Mark messages as read
     */
    socket.on('student:mark-read', async (data) => {
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
        }
        catch (error) {
            console.error('Error marking messages as read:', error);
        }
    });
    /**
     * Request evaluation notifications
     */
    socket.on('student:subscribe-evaluations', (internshipId) => {
        socket.join(`evaluation:${internshipId}`);
        console.log(`Student subscribed to evaluation updates for internship: ${internshipId}`);
    });
    /**
     * Request document notifications
     */
    socket.on('student:subscribe-documents', (internshipId) => {
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
exports.setupStudentHandlers = setupStudentHandlers;
/**
 * Emit functions to be used by controllers/services
 */
/**
 * Notify student of new evaluation
 */
const notifyStudentEvaluation = (io, userId, evaluation) => {
    io.to(`user:${userId}`).emit('evaluation:new', {
        type: 'evaluation_received',
        evaluation,
        timestamp: new Date().toISOString(),
    });
};
exports.notifyStudentEvaluation = notifyStudentEvaluation;
/**
 * Notify student of evaluation update
 */
const notifyStudentEvaluationUpdate = (io, userId, evaluation) => {
    io.to(`user:${userId}`).emit('evaluation:updated', {
        type: 'evaluation_updated',
        evaluation,
        timestamp: new Date().toISOString(),
    });
};
exports.notifyStudentEvaluationUpdate = notifyStudentEvaluationUpdate;
/**
 * Notify student of document status change
 */
const notifyStudentDocumentUpdate = (io, userId, internshipId, document) => {
    io.to(`user:${userId}`).emit('document:status-changed', {
        type: 'document_status_changed',
        document,
        timestamp: new Date().toISOString(),
    });
    io.to(`documents:${internshipId}`).emit('document:updated', document);
};
exports.notifyStudentDocumentUpdate = notifyStudentDocumentUpdate;
/**
 * Notify student of new message
 */
const notifyStudentMessage = (io, conversationId, message, recipientIds) => {
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
exports.notifyStudentMessage = notifyStudentMessage;
/**
 * Notify student of general notification
 */
const notifyStudent = (io, userId, notification) => {
    io.to(`user:${userId}`).emit('notification:new', {
        notification,
        timestamp: new Date().toISOString(),
    });
};
exports.notifyStudent = notifyStudent;
/**
 * Broadcast internship update to student
 */
const notifyStudentInternshipUpdate = (io, internshipId, userId, update) => {
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
exports.notifyStudentInternshipUpdate = notifyStudentInternshipUpdate;
//# sourceMappingURL=studentHandler.js.map