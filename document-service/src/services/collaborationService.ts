import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

export class CollaborationService {
  // Start a collaboration session
  async startSession(documentId: string, userId: string, userColor: string) {
    const { data, error } = await supabase
      .from("collaboration_sessions")
      .insert({
        document_id: documentId,
        user_id: userId,
        user_color: userColor,
        is_active: true,
        last_seen: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update user presence (cursor, selection)
  async updatePresence(
    sessionId: string,
    cursorPosition: number,
    selectionRange: any
  ) {
    const { data, error } = await supabase
      .from("collaboration_sessions")
      .update({
        cursor_position: cursorPosition,
        selection_range: selectionRange,
        last_seen: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get active collaborators
  async getActiveUsers(documentId: string) {
    const { data, error } = await supabase
      .from("collaboration_sessions")
      .select("*, user:users(id, first_name, last_name, email)")
      .eq("document_id", documentId);

    if (error) throw error;
    return data;
  }

  // End session
  async endSession(sessionId: string) {
    const { error } = await supabase
      .from("collaboration_sessions")
      .update({ is_active: false })
      .eq("id", sessionId);

    if (error) throw error;
  }

  // Clean up stale sessions
  async cleanupStaleSessions() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from("collaboration_sessions")
      .update({ is_active: false })
      .lt("last_seen", fiveMinutesAgo)
      .eq("is_active", true);

    if (error) throw error;
  }

  // Save collaborative change
  async saveChange(
    documentId: string,
    userId: string,
    operationType: string,
    position: number,
    content: string,
    attributes: any
  ) {
    const { data, error } = await supabase
      .from("document_changes")
      .insert({
        document_id: documentId,
        user_id: userId,
        operation_type: operationType,
        position,
        content,
        attributes,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get unsync'd changes
  async getUnsyncedChanges(documentId: string) {
    const { data, error } = await supabase
      .from("document_changes")
      .select("*")
      .eq("document_id", documentId)
      .eq("synced", false)
      .order("timestamp", { ascending: true });

    if (error) throw error;
    return data;
  }

  // Mark changes as synced
  async markChangesSynced(changeIds: string[]) {
    const { error } = await supabase
      .from("document_changes")
      .update({ synced: true })
      .in("id", changeIds);

    if (error) throw error;
  }
}

export default new CollaborationService();
