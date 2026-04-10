import { createClient } from "@supabase/supabase-js";
import { emitNewNotification, emitNotificationCountUpdate } from "../socket/emitters";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export const messageService = {
  // Get users that the current user is allowed to message based on roles and assignments
  async getContacts(userId: string, role: string) {
    try {
      let contacts: any[] = [];

      if (role === 'student') {
        const { data: internships } = await supabase
          .from('internships')
          .select('advisor_id, users!internships_advisor_id_fkey(id, first_name, last_name, email, role, profile_data)')
          .eq('student_id', userId)
          .single();

        if (internships && internships.users) {
          contacts.push(internships.users);
        }
      } else if (role === 'advisor') {
        const { data: internships } = await supabase
          .from('internships')
          .select(`
            student_id, users!internships_student_id_fkey(id, first_name, last_name, email, role, profile_data),
            supervisor_id, supervisor:users!internships_supervisor_id_fkey(id, first_name, last_name, email, role, profile_data)
          `)
          .eq('advisor_id', userId);

        if (internships) {
          internships.forEach((internship: any) => {
            if (internship.users) {
              // Add student
              if (!contacts.find(c => c.id === internship.users.id)) {
                contacts.push(internship.users);
              }
            }
            if (internship.supervisor) {
              // Add supervisor
              if (!contacts.find(c => c.id === internship.supervisor.id)) {
                contacts.push(internship.supervisor);
              }
            }
          });
        }
      } else if (role === 'supervisor') {
        const { data: internships } = await supabase
          .from('internships')
          .select('advisor_id, users!internships_advisor_id_fkey(id, first_name, last_name, email, role, profile_data)')
          .eq('supervisor_id', userId);

        if (internships) {
          internships.forEach((internship: any) => {
             if (internship.users && !contacts.find(c => c.id === internship.users.id)) {
                contacts.push(internship.users);
             }
          });
        }
      }

      // Get unread counts
      const { data: unreadMessages } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('receiver_id', userId)
        .eq('is_read', false);

      const unreadMap = new Map<string, number>();
      if (unreadMessages) {
        unreadMessages.forEach((msg: any) => {
          unreadMap.set(msg.sender_id, (unreadMap.get(msg.sender_id) || 0) + 1);
        });
      }

      const contactsWithUnread = contacts.map((c: any) => ({
        ...c,
        unread_count: unreadMap.get(c.id) || 0
      }));

      return contactsWithUnread;
    } catch (error) {
      console.error("Error fetching contacts:", error);
      throw error;
    }
  },

  async getMessages(user1Id: string, user2Id: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user1Id},receiver_id.eq.${user2Id}),and(sender_id.eq.${user2Id},receiver_id.eq.${user1Id})`)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  async sendMessage(senderId: string, receiverId: string, content: string) {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        content
      })
      .select()
      .single();

    if (error) throw error;
    
    // Check if we need to create a notification
    const { data: senderInfo } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', senderId)
      .single();
      
    const senderName = senderInfo ? `${senderInfo.first_name} ${senderInfo.last_name}` : 'A user';

    const { data: receiverInfo } = await supabase
      .from('users')
      .select('role')
      .eq('id', receiverId)
      .single();
    
    const actionUrl = receiverInfo ? `/dashboard/${receiverInfo.role}/messages` : '/';

    const { data: notificationData } = await supabase
      .from('notifications')
      .insert({
        user_id: receiverId,
        type: 'new_message',
        title: 'New Message',
        message: `You have received a new message from ${senderName}.`,
        action_url: actionUrl,
        reference_id: data.id,
        reference_type: 'message',
        is_read: false
      })
      .select()
      .single();

    // Emit realtime socket event so NotificationsDropdown updates immediately
    if (notificationData) {
      emitNewNotification(receiverId, notificationData);
      // Also update the unread count badge
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', receiverId)
        .eq('is_read', false);
      emitNotificationCountUpdate(receiverId, count || 0);
    }

    return data;
  },

  async markAsRead(messageIds: string[]) {
    if (!messageIds.length) return;
    
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in('id', messageIds);

    if (error) throw error;
  }
};
