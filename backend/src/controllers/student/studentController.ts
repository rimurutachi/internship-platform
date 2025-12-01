import { Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { AuthRequest } from '../../middleware/auth';
import studentService from '../../services/studentService';

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

class StudentController {
  /**
   * GET /api/student/profile
   * Get student profile
   */
  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { data: student, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .eq('role', 'student')
        .single();

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      if (!student) {
        return res.status(404).json({ success: false, error: 'Student not found' });
      }

      res.json({ success: true, data: { user: student } });
    } catch (error: any) {
      console.error('Error getting student profile:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * PATCH /api/student/profile
   * Update student profile
   */
  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { first_name, last_name, profile_data } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (first_name) updateData.first_name = first_name;
      if (last_name) updateData.last_name = last_name;
      if (first_name && last_name) updateData.name = `${first_name} ${last_name}`;
      if (profile_data) updateData.profile_data = profile_data;

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      res.json({ success: true, data: { user: data, message: 'Profile updated successfully' } });
    } catch (error: any) {
      console.error('Error updating student profile:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/student/profile/settings
   * Get student settings
   */
  async getSettings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { data: user, error } = await supabase
        .from('users')
        .select('profile_data')
        .eq('id', userId)
        .single();

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      const settings = user?.profile_data?.settings || {
        notification_preferences: {
          email: true,
          push: true,
          evaluation_updates: true,
          message_alerts: true,
          document_reminders: true,
        },
        privacy_settings: {
          profile_visibility: 'private',
          show_contact_info: false,
        },
      };

      res.json({ success: true, data: { settings } });
    } catch (error: any) {
      console.error('Error getting student settings:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * PATCH /api/student/profile/settings
   * Update student settings
   */
  async updateSettings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { notification_preferences, privacy_settings } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      // Get current profile_data
      const { data: currentUser } = await supabase
        .from('users')
        .select('profile_data')
        .eq('id', userId)
        .single();

      const updatedProfileData = {
        ...(currentUser?.profile_data || {}),
        settings: {
          ...(currentUser?.profile_data?.settings || {}),
          ...(notification_preferences && { notification_preferences }),
          ...(privacy_settings && { privacy_settings }),
        },
      };

      const { error } = await supabase
        .from('users')
        .update({ profile_data: updatedProfileData, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      res.json({ success: true, data: { message: 'Settings updated successfully' } });
    } catch (error: any) {
      console.error('Error updating student settings:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/student/internship
   * Get current internship
   */
  async getCurrentInternship(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const internship = await studentService.getCurrentInternship(userId);

      if (!internship) {
        return res.status(404).json({ success: false, error: 'No active internship found' });
      }

      res.json({ success: true, data: { internship } });
    } catch (error: any) {
      console.error('Error getting current internship:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/student/internship/timeline
   * Get internship timeline/milestones
   */
  async getInternshipTimeline(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const internship = await studentService.getCurrentInternship(userId);

      if (!internship) {
        return res.status(404).json({ success: false, error: 'No active internship found' });
      }

      // Generate timeline based on internship dates
      const start = new Date(internship.start_date);
      const end = new Date(internship.end_date);
      const today = new Date();

      const milestones = [
        {
          title: 'Internship Start',
          dueDate: internship.start_date,
          status: today >= start ? 'completed' : 'pending',
          description: 'Begin your internship journey',
        },
        {
          title: 'Onboarding Complete',
          dueDate: new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: today >= new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000) ? 'completed' : 'pending',
          description: 'Complete orientation and initial training',
        },
        {
          title: 'Mid-term Evaluation',
          dueDate: new Date((start.getTime() + end.getTime()) / 2).toISOString().split('T')[0],
          status: today >= new Date((start.getTime() + end.getTime()) / 2) ? 'completed' : 'pending',
          description: 'Mid-point performance review',
        },
        {
          title: 'Final Evaluation',
          dueDate: internship.end_date,
          status: today >= end ? 'completed' : 'pending',
          description: 'Complete final assessment and documentation',
        },
      ];

      res.json({ success: true, data: { milestones } });
    } catch (error: any) {
      console.error('Error getting internship timeline:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/student/internship/progress
   * Get progress metrics
   */
  async getProgress(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const internship = await studentService.getCurrentInternship(userId);

      if (!internship) {
        return res.status(404).json({ success: false, error: 'No active internship found' });
      }

      const progress = studentService.calculateProgressMetrics(
        internship.start_date,
        internship.end_date
      );

      res.json({ success: true, data: progress });
    } catch (error: any) {
      console.error('Error getting progress:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/student/evaluations
   * Get all evaluations
   */
  async getEvaluations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const internship = await studentService.getCurrentInternship(userId);

      if (!internship) {
        return res.status(404).json({ success: false, error: 'No internship found' });
      }

      const result = await studentService.getEvaluations(internship.id, limit, offset);

      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('Error getting evaluations:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/student/evaluations/:id
   * Get single evaluation
   */
  async getEvaluation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      // First verify the evaluation belongs to student's internship
      const internship = await studentService.getCurrentInternship(userId);

      if (!internship) {
        return res.status(404).json({ success: false, error: 'No internship found' });
      }

      const { data: evaluation, error } = await supabase
        .from('evaluations')
        .select(
          `
          *,
          supervisor:users!evaluations_supervisor_id_fkey(id, first_name, last_name, email)
        `
        )
        .eq('id', id)
        .eq('internship_id', internship.id)
        .single();

      if (error || !evaluation) {
        return res.status(404).json({ success: false, error: 'Evaluation not found' });
      }

      // Format supervisor name
      if (evaluation.supervisor) {
        evaluation.supervisor.name = `${evaluation.supervisor.first_name} ${evaluation.supervisor.last_name}`;
      }

      res.json({ success: true, data: { evaluation } });
    } catch (error: any) {
      console.error('Error getting evaluation:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/student/skills-assessment
   * Get aggregated skills assessment
   */
  async getSkillsAssessment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const internship = await studentService.getCurrentInternship(userId);

      if (!internship) {
        return res.status(404).json({ success: false, error: 'No internship found' });
      }

      const assessment = await studentService.getSkillsAssessment(internship.id);

      res.json({ success: true, data: assessment });
    } catch (error: any) {
      console.error('Error getting skills assessment:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/student/documents
   * Get all documents
   */
  async getDocuments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { type, status } = req.query;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const internship = await studentService.getCurrentInternship(userId);

      if (!internship) {
        return res.status(404).json({ success: false, error: 'No internship found' });
      }

      let query = supabase
        .from('documents')
        .select('*')
        .eq('internship_id', internship.id);

      if (type && type !== 'all') {
        query = query.eq('type', type);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data: documents, error } = await query.order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      res.json({ success: true, data: { documents: documents || [] } });
    } catch (error: any) {
      console.error('Error getting documents:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/student/documents
   * Upload new document
   */
  async uploadDocument(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { title, type, file_url, document_template_id } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      if (!title || !type) {
        return res.status(400).json({ success: false, error: 'Title and type are required' });
      }

      const internship = await studentService.getCurrentInternship(userId);

      if (!internship) {
        return res.status(404).json({ success: false, error: 'No internship found' });
      }

      const { data: document, error } = await supabase
        .from('documents')
        .insert({
          internship_id: internship.id,
          title,
          type,
          file_url: file_url || null,
          document_template_id: document_template_id || null,
          uploaded_by: userId,
          status: 'pending',
          version: '1.0',
        })
        .select()
        .single();

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      res.status(201).json({
        success: true,
        data: { document, message: 'Document uploaded successfully' },
      });
    } catch (error: any) {
      console.error('Error uploading document:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/student/documents/:id
   * Get single document
   */
  async getDocument(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const internship = await studentService.getCurrentInternship(userId);

      if (!internship) {
        return res.status(404).json({ success: false, error: 'No internship found' });
      }

      const { data: document, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .eq('internship_id', internship.id)
        .single();

      if (error || !document) {
        return res.status(404).json({ success: false, error: 'Document not found' });
      }

      res.json({ success: true, data: { document } });
    } catch (error: any) {
      console.error('Error getting document:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * PATCH /api/student/documents/:id
   * Update document
   */
  async updateDocument(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { title, status } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const internship = await studentService.getCurrentInternship(userId);

      if (!internship) {
        return res.status(404).json({ success: false, error: 'No internship found' });
      }

      // Verify ownership
      const { data: existingDoc } = await supabase
        .from('documents')
        .select('uploaded_by')
        .eq('id', id)
        .eq('internship_id', internship.id)
        .single();

      if (!existingDoc || existingDoc.uploaded_by !== userId) {
        return res.status(403).json({ success: false, error: 'Not authorized to update this document' });
      }

      const updateData: any = { updated_at: new Date().toISOString() };
      if (title) updateData.title = title;
      if (status) updateData.status = status;

      const { data: document, error } = await supabase
        .from('documents')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      res.json({ success: true, data: { document, message: 'Document updated successfully' } });
    } catch (error: any) {
      console.error('Error updating document:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * DELETE /api/student/documents/:id
   * Soft delete document (archive)
   */
  async deleteDocument(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const internship = await studentService.getCurrentInternship(userId);

      if (!internship) {
        return res.status(404).json({ success: false, error: 'No internship found' });
      }

      // Verify ownership
      const { data: existingDoc } = await supabase
        .from('documents')
        .select('uploaded_by')
        .eq('id', id)
        .eq('internship_id', internship.id)
        .single();

      if (!existingDoc || existingDoc.uploaded_by !== userId) {
        return res.status(403).json({ success: false, error: 'Not authorized to delete this document' });
      }

      // Soft delete by updating status
      const { error } = await supabase
        .from('documents')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      res.json({ success: true, data: { message: 'Document archived successfully' } });
    } catch (error: any) {
      console.error('Error deleting document:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/student/documents/required
   * Get required documents status
   */
  async getRequiredDocuments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const internship = await studentService.getCurrentInternship(userId);

      if (!internship) {
        return res.status(404).json({ success: false, error: 'No internship found' });
      }

      const status = await studentService.getRequiredDocumentsStatus(internship.id);

      const requiredDocuments = [
        {
          type: 'MOA',
          status: status.moa,
          submitted_date: status.moa === 'approved' ? internship.start_date : null,
        },
        {
          type: 'Job Description',
          status: status.job_description,
          submitted_date: status.job_description === 'approved' ? internship.start_date : null,
        },
        ...status.weekly_reports.map((report: any, index: number) => ({
          type: 'Weekly Report',
          week: index + 1,
          status: report.status,
          submitted_date: report.date,
        })),
        {
          type: 'Final Evaluation',
          status: status.final_evaluation,
          due_date: internship.end_date,
        },
      ];

      res.json({ success: true, data: { required_documents: requiredDocuments } });
    } catch (error: any) {
      console.error('Error getting required documents:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/student/messages/conversations
   * Get all conversations
   */
  async getConversations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { type, limit = '20', offset = '0' } = req.query;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      // Get conversations where user is a participant
      let query = supabase
        .from('conversations')
        .select('*')
        .contains('participant_ids', [userId]);

      if (type && type !== 'all') {
        query = query.eq('type', type);
      }

      const { data: conversations, error } = await query
        .order('updated_at', { ascending: false })
        .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      // Enrich with participant details and last message
      const enrichedConversations = await Promise.all(
        (conversations || []).map(async (conv) => {
          // Get participants
          const { data: participants } = await supabase
            .from('users')
            .select('id, first_name, last_name, email, role')
            .in('id', conv.participant_ids);

          // Get last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get unread count
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', userId)
            .is('read_at', null);

          return {
            ...conv,
            participants: participants?.map((p) => ({
              id: p.id,
              name: `${p.first_name} ${p.last_name}`,
              email: p.email,
              role: p.role,
            })),
            last_message: lastMessage?.content,
            last_message_time: lastMessage?.created_at,
            unread_count: unreadCount || 0,
          };
        })
      );

      res.json({ success: true, data: { conversations: enrichedConversations } });
    } catch (error: any) {
      console.error('Error getting conversations:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/student/messages/conversations/:id
   * Get messages in conversation
   */
  async getConversationMessages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { limit = '20', offset = '0' } = req.query;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      // Verify user is participant
      const { data: conversation } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', id)
        .single();

      if (!conversation || !conversation.participant_ids.includes(userId)) {
        return res.status(403).json({ success: false, error: 'Not authorized to view this conversation' });
      }

      // Get messages
      const { data: messages, count, error } = await supabase
        .from('messages')
        .select(
          `
          *,
          sender:users!messages_sender_id_fkey(id, first_name, last_name, email, role)
        `,
          { count: 'exact' }
        )
        .eq('conversation_id', id)
        .order('created_at', { ascending: false })
        .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      // Format sender names
      const formattedMessages = (messages || []).map((msg) => {
        if (msg.sender) {
          msg.sender.name = `${msg.sender.first_name} ${msg.sender.last_name}`;
        }
        return msg;
      });

      res.json({
        success: true,
        data: {
          conversation,
          messages: formattedMessages,
          pagination: {
            total: count || 0,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
          },
        },
      });
    } catch (error: any) {
      console.error('Error getting conversation messages:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/student/messages/conversations/:id/messages
   * Send message
   */
  async sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { content, file_url } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      if (!content && !file_url) {
        return res.status(400).json({ success: false, error: 'Content or file is required' });
      }

      // Verify user is participant
      const { data: conversation } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', id)
        .single();

      if (!conversation || !conversation.participant_ids.includes(userId)) {
        return res.status(403).json({ success: false, error: 'Not authorized to send messages in this conversation' });
      }

      // Insert message
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: id,
          sender_id: userId,
          content,
          file_url: file_url || null,
          message_type: file_url ? 'file' : 'text',
        })
        .select()
        .single();

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      // Update conversation's updated_at
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', id);

      // TODO: Emit WebSocket event
      // io.to(id).emit('new_message', message);

      res.status(201).json({ success: true, data: { message, created_at: message.created_at } });
    } catch (error: any) {
      console.error('Error sending message:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/student/messages/conversations
   * Create new conversation
   */
  async createConversation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { participant_ids, type = 'direct' } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      if (!participant_ids || !Array.isArray(participant_ids) || participant_ids.length === 0) {
        return res.status(400).json({ success: false, error: 'Participant IDs are required' });
      }

      // Include current user in participants
      const allParticipants = Array.from(new Set([userId, ...participant_ids]));

      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert({
          type,
          participant_ids: allParticipants,
        })
        .select()
        .single();

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      res.status(201).json({ success: true, data: { conversation } });
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/student/messages/conversations/:id/mark-read
   * Mark conversation as read
   */
  async markConversationRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      // Update all unread messages in conversation
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', id)
        .neq('sender_id', userId)
        .is('read_at', null);

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      res.json({ success: true, data: { message: 'Conversation marked as read' } });
    } catch (error: any) {
      console.error('Error marking conversation as read:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/student/reminders
   * Get upcoming reminders
   */
  async getReminders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const internship = await studentService.getCurrentInternship(userId);

      if (!internship) {
        return res.json({ success: true, data: { reminders: [] } });
      }

      // Get pending documents as reminders
      const { data: documents } = await supabase
        .from('documents')
        .select('*')
        .eq('internship_id', internship.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      const today = new Date();
      const reminders = (documents || []).map((doc) => {
        const dueDate = new Date(doc.created_at);
        dueDate.setDate(dueDate.getDate() + 7); // Assume 7 days to submit
        const daysUntilDue = Math.ceil(
          (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          id: doc.id,
          type: `${doc.type.toLowerCase().replace(' ', '_')}_due`,
          title: `Submit ${doc.title}`,
          due_date: dueDate.toISOString().split('T')[0],
          days_until_due: daysUntilDue,
          priority: daysUntilDue <= 2 ? 'high' : daysUntilDue <= 5 ? 'medium' : 'low',
        };
      });

      res.json({ success: true, data: { reminders } });
    } catch (error: any) {
      console.error('Error getting reminders:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/student/notifications
   * Get notifications
   */
  async getNotifications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { limit = '20', offset = '0', is_read } = req.query;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId);

      if (is_read !== undefined) {
        query = query.eq('is_read', is_read === 'true');
      }

      const { data: notifications, error } = await query
        .order('created_at', { ascending: false })
        .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      res.json({ success: true, data: { notifications: notifications || [] } });
    } catch (error: any) {
      console.error('Error getting notifications:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * PATCH /api/student/notifications/:id/read
   * Mark notification as read
   */
  async markNotificationRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      res.json({ success: true, data: { message: 'Notification marked as read' } });
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * PATCH /api/student/notifications/read-all
   * Mark all notifications as read
   */
  async markAllNotificationsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      res.json({ success: true, data: { message: 'All notifications marked as read' } });
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/student/mentors
   * Get advisor and supervisor info
   */
  async getMentors(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const internship = await studentService.getCurrentInternship(userId);

      if (!internship) {
        return res.status(404).json({ success: false, error: 'No internship found' });
      }

      res.json({
        success: true,
        data: {
          advisor: internship.advisor || null,
          supervisor: internship.supervisor || null,
        },
      });
    } catch (error: any) {
      console.error('Error getting mentors:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/student/mentors/:id/message
   * Quick message to mentor
   */
  async messageMentor(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { id: mentorId } = req.params;
      const { message } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      if (!message) {
        return res.status(400).json({ success: false, error: 'Message is required' });
      }

      // Check if conversation exists
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('*')
        .contains('participant_ids', [userId])
        .contains('participant_ids', [mentorId])
        .eq('type', 'direct')
        .single();

      let conversationId = existingConversation?.id;

      // Create conversation if it doesn't exist
      if (!conversationId) {
        const { data: newConversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            type: 'direct',
            participant_ids: [userId, mentorId],
          })
          .select()
          .single();

        if (convError) {
          return res.status(500).json({ success: false, error: convError.message });
        }

        conversationId = newConversation.id;
      }

      // Send message
      const { data: messageData, error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          content: message,
          message_type: 'text',
        })
        .select()
        .single();

      if (msgError) {
        return res.status(500).json({ success: false, error: msgError.message });
      }

      // Update conversation
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      res.status(201).json({
        success: true,
        data: { message: messageData, conversation_id: conversationId },
      });
    } catch (error: any) {
      console.error('Error messaging mentor:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/student/tasks
   * Get tasks (using documents as tasks)
   */
  async getTasks(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { status } = req.query;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const internship = await studentService.getCurrentInternship(userId);

      if (!internship) {
        return res.json({ success: true, data: { tasks: [] } });
      }

      let query = supabase
        .from('documents')
        .select('*')
        .eq('internship_id', internship.id);

      if (status && status !== 'all') {
        if (status === 'completed') {
          query = query.eq('status', 'approved');
        } else if (status === 'pending') {
          query = query.in('status', ['pending', 'submitted']);
        } else if (status === 'overdue') {
          // This would require additional logic based on due dates
          query = query.eq('status', 'pending');
        }
      }

      const { data: documents, error } = await query.order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      // Transform documents to tasks
      const tasks = (documents || []).map((doc) => ({
        id: doc.id,
        title: doc.title,
        description: `Submit ${doc.type}`,
        due_date: doc.created_at, // Could be enhanced with actual due dates
        status: doc.status === 'approved' ? 'completed' : 'pending',
        completed_date: doc.status === 'approved' ? doc.updated_at : null,
        assigned_by: 'System',
        priority: doc.status === 'pending' ? 'high' : 'medium',
      }));

      res.json({ success: true, data: { tasks } });
    } catch (error: any) {
      console.error('Error getting tasks:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * PATCH /api/student/tasks/:id
   * Update task (document status)
   */
  async updateTask(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { status, notes } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const internship = await studentService.getCurrentInternship(userId);

      if (!internship) {
        return res.status(404).json({ success: false, error: 'No internship found' });
      }

      // Update document status
      const updateData: any = {
        status: status === 'completed' ? 'submitted' : status,
        updated_at: new Date().toISOString(),
      };

      if (notes) {
        updateData.notes = notes;
      }

      const { data: task, error } = await supabase
        .from('documents')
        .update(updateData)
        .eq('id', id)
        .eq('internship_id', internship.id)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      res.json({ success: true, data: { task, message: 'Task updated successfully' } });
    } catch (error: any) {
      console.error('Error updating task:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/student/dashboard
   * Get complete dashboard data
   */
  async getDashboardOverview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const dashboardData = await studentService.getDashboardData(userId);

      if (!dashboardData) {
        return res.status(404).json({
          success: false,
          error: 'No active internship found',
          data: {
            internship: null,
            progress: null,
            recent_evaluations: [],
            upcoming_tasks: [],
            notifications_count: 0,
          },
        });
      }

      res.json({ success: true, data: dashboardData });
    } catch (error: any) {
      console.error('Error getting dashboard overview:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export default new StudentController();
