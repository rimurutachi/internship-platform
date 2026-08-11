import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

// Color palette for user presence indicators
const PRESENCE_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#FFA07A",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E2",
  "#F8B88B",
  "#A8E6CF",
];

interface ChangeRecord {
  documentId: string;
  userId: string;
  operation: string;
  index: number;
  content?: string;
  timestamp: string;
  metadata: Record<string, any>;
  id?: string;
}

interface UndoRedoState {
  documentId: string;
  userId: string;
  undoStack: ChangeRecord[];
  redoStack: ChangeRecord[];
  currentIndex: number;
}

interface UserPresence {
  userId: string;
  userName: string;
  userEmail: string;
  color: string;
  isEditing: boolean;
  lastActive: string;
  cursorPosition?: any;
  selectionRange?: any;
}

// In-memory undo/redo stacks (could be persisted to Redis for scaling)
const undoRedoStates = new Map<string, UndoRedoState>();
const userPresence = new Map<string, UserPresence>();

export const collaborationService = {
  /**
   * Initialize collaboration session for a document
   */
  async initializeSession(
    documentId: string,
    userId: string,
    userName: string,
    userEmail: string
  ): Promise<{ sessionId: string; color: string }> {
    console.log("🤝 [Collab] Initializing session", {
      documentId: documentId.substring(0, 8),
      userId: userId.substring(0, 8),
    });
    try {
      const color =
        PRESENCE_COLORS[Math.floor(Math.random() * PRESENCE_COLORS.length)];
      const sessionId = `${documentId}_${userId}_${Date.now()}`;

      const { error } = await supabase.from("collaboration_sessions").insert({
        document_id: documentId,
        user_id: userId,
        is_active: true,
        last_seen: new Date().toISOString(),
      });

      if (error) {
        console.error("❌ [Collab] Session init error", error);
        throw error;
      }

      // Store in-memory presence
      userPresence.set(userId, {
        userId,
        userName,
        userEmail,
        color,
        isEditing: false,
        lastActive: new Date().toISOString(),
      });

      console.log("✅ [Collab] Session initialized", {
        sessionId: sessionId.substring(0, 20),
      });
      return { sessionId, color };
    } catch (error) {
      console.error("❌ [Collab Service] Session init error", error);
      throw error;
    }
  },

  /**
   * End collaboration session
   */
  async endSession(
    documentId: string,
    userId: string,
    sessionId: string
  ): Promise<boolean> {
    console.log("👋 [Collab] Ending session", {
      documentId: documentId.substring(0, 8),
      userId: userId.substring(0, 8),
    });
    try {
      const { error } = await supabase
        .from("collaboration_sessions")
        .update({ 
          is_active: false,
          last_seen: new Date().toISOString() 
        })
        .eq("document_id", documentId)
        .eq("user_id", userId)
        .is("is_active", true);

      if (error) {
        console.error("❌ [Collab] Session end error", error);
        throw error;
      }

      // Remove from in-memory presence
      userPresence.delete(userId);

      // Clean up undo/redo stack if no other sessions exist
      const key = `${documentId}_${userId}`;
      const activeSessions = await supabase
        .from("collaboration_sessions")
        .select("id")
        .eq("document_id", documentId)
        .eq("user_id", userId)
        .is("is_active", true);

      if (activeSessions.data?.length === 0) {
        undoRedoStates.delete(key);
      }

      console.log("✅ [Collab] Session ended");
      return true;
    } catch (error) {
      console.error("❌ [Collab Service] Session end error", error);
      return false;
    }
  },

  /**
   * Record document change (for CRDT)
   */
  async recordChange(change: ChangeRecord): Promise<boolean> {
    console.log("📝 [Collab] Recording change", {
      documentId: change.documentId.substring(0, 8),
      operation: change.operation,
    });
    try {
      const { error } = await supabase.from("document_changes").insert({
        document_id: change.documentId,
        user_id: change.userId,
        operation_type: change.operation,
        position: change.index,
        content: change.content || null,
        attributes: change.metadata || {},
        timestamp: change.timestamp || new Date().toISOString()
      });

      if (error) {
        console.error("❌ [Collab] Record change error", error);
        throw error;
      }

      // Add to undo stack
      const key = `${change.documentId}_${change.userId}`;
      if (!undoRedoStates.has(key)) {
        undoRedoStates.set(key, {
          documentId: change.documentId,
          userId: change.userId,
          undoStack: [],
          redoStack: [],
          currentIndex: 0,
        });
      }
      const state = undoRedoStates.get(key)!;
      state.undoStack.push(change);
      state.redoStack = []; // Clear redo stack on new change
      state.currentIndex++;

      console.log("✅ [Collab] Change recorded");
      return true;
    } catch (error) {
      console.error("❌ [Collab Service] Record change error", error);
      return false;
    }
  },

  /**
   * Get document change history
   */
  async getChangeHistory(
    documentId: string,
    limit: number = 100
  ): Promise<ChangeRecord[]> {
    console.log("📜 [Collab] Getting change history", {
      documentId: documentId.substring(0, 8),
    });
    try {
      const { data, error } = await supabase
        .from("document_changes")
        .select(
          "id, document_id, user_id, change_type as operation, index, content, timestamp, metadata, user:users!user_id(id, first_name, last_name)"
        )
        .eq("document_id", documentId)
        .order("timestamp", { ascending: true })
        .limit(limit);

      if (error) {
        console.error("❌ [Collab] History error", error);
        return [];
      }

      console.log("✅ [Collab] History retrieved", { count: data?.length || 0 });
      return (data || []).map((row: any) => ({
        id: row.id,
        documentId: row.document_id,
        userId: row.user_id,
        operation: row.operation,
        index: row.index,
        content: row.content,
        timestamp: row.timestamp,
        metadata: row.metadata,
      }));
    } catch (error) {
      console.error("❌ [Collab Service] Get history error", error);
      return [];
    }
  },

  /**
   * Update user presence (cursor position, editing state)
   */
  async updatePresence(
    documentId: string,
    userId: string,
    presence: Partial<UserPresence>
  ): Promise<boolean> {
    console.log("👁️ [Collab] Updating presence", {
      documentId: documentId.substring(0, 8),
    });
    try {
      const existing = userPresence.get(userId);
      if (!existing) {
        console.warn("⚠️ [Collab] User presence not found");
        return false;
      }

      const updated = { ...existing, ...presence, lastActive: new Date().toISOString() };
      userPresence.set(userId, updated);

      await supabase
        .from("collaboration_sessions")
        .update({
          cursor_position: presence.cursorPosition || null,
          is_editing: presence.isEditing ?? false,
        })
        .eq("user_id", userId)
        .eq("document_id", documentId)
        .is("ended_at", null);

      console.log("✅ [Collab] Presence updated");
      return true;
    } catch (error) {
      console.error("❌ [Collab Service] Update presence error", error);
      return false;
    }
  },

  /**
   * Get active users in document
   */
  async getActiveUsers(documentId: string): Promise<UserPresence[]> {
    console.log("👥 [Collab] Getting active users", {
      documentId: documentId.substring(0, 8),
    });
    try {
      const { data, error } = await supabase
        .from("collaboration_sessions")
        .select(
          "id, user_id, user:users!user_id(id, first_name, last_name, email)"
        )
        .eq("document_id", documentId)
        .is("is_active", true);

      if (error) {
        console.error("❌ [Collab] Get active users error", error);
        return [];
      }

      const uniqueUsersMap = new Map<string, UserPresence>();
      
      (data || []).forEach((session: any) => {
        const userObj = Array.isArray(session.user) ? session.user[0] : session.user;
        const firstName = userObj?.first_name || '';
        const lastName = userObj?.last_name || '';
        const name = `${firstName} ${lastName}`.trim();
        
        // Only keep the most recent session per user (if duplicates exist)
        if (!uniqueUsersMap.has(session.user_id)) {
          uniqueUsersMap.set(session.user_id, {
            userId: session.user_id,
            userName: name || "Unknown User",
            userEmail: userObj?.email || "unknown@example.com",
            color: session.user_color || PRESENCE_COLORS[Math.floor(Math.random() * PRESENCE_COLORS.length)],
            isEditing: false, // Not tracked in current schema
            lastActive: session.last_seen || new Date().toISOString(),
          });
        }
      });

      const users: UserPresence[] = Array.from(uniqueUsersMap.values());

      console.log("✅ [Collab] Active users retrieved", { count: users.length });
      return users;
    } catch (error) {
      console.error("❌ [Collab Service] Get active users error", error);
      return [];
    }
  },

  /**
   * Perform undo operation
   */
  async undo(
    documentId: string,
    userId: string
  ): Promise<ChangeRecord | null> {
    console.log("↶ [Collab] Undo operation", {
      documentId: documentId.substring(0, 8),
    });
    try {
      const key = `${documentId}_${userId}`;
      const state = undoRedoStates.get(key);
      if (!state || state.undoStack.length === 0) {
        console.warn("⚠️ [Collab] Nothing to undo");
        return null;
      }

      const change = state.undoStack.pop()!;
      state.redoStack.push(change);
      state.currentIndex--;

      const inverseChange: ChangeRecord = {
        documentId,
        userId,
        operation: change.operation === "insert" ? "delete" : "insert",
        index: change.index,
        content: change.operation === "delete" ? change.content : undefined,
        timestamp: new Date().toISOString(),
        metadata: { undo_of: change.id, is_undo: true },
      };

      console.log("✅ [Collab] Undo completed");
      return inverseChange;
    } catch (error) {
      console.error("❌ [Collab Service] Undo error", error);
      return null;
    }
  },

  /**
   * Perform redo operation
   */
  async redo(
    documentId: string,
    userId: string
  ): Promise<ChangeRecord | null> {
    console.log("↷ [Collab] Redo operation", {
      documentId: documentId.substring(0, 8),
    });
    try {
      const key = `${documentId}_${userId}`;
      const state = undoRedoStates.get(key);
      if (!state || state.redoStack.length === 0) {
        console.warn("⚠️ [Collab] Nothing to redo");
        return null;
      }

      const change = state.redoStack.pop()!;
      state.undoStack.push(change);
      state.currentIndex++;

      const redoChange: ChangeRecord = {
        documentId,
        userId,
        operation: change.operation,
        index: change.index,
        content: change.content,
        timestamp: new Date().toISOString(),
        metadata: { redo_of: change.id, is_redo: true },
      };

      console.log("✅ [Collab] Redo completed");
      return redoChange;
    } catch (error) {
      console.error("❌ [Collab Service] Redo error", error);
      return null;
    }
  },

  /**
   * Get undo/redo stack status
   */
  getStackStatus(
    documentId: string,
    userId: string
  ): { canUndo: boolean; canRedo: boolean; undoCount: number; redoCount: number } {
    const key = `${documentId}_${userId}`;
    const state = undoRedoStates.get(key);
    if (!state) {
      return { canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 };
    }
    return {
      canUndo: state.undoStack.length > 0,
      canRedo: state.redoStack.length > 0,
      undoCount: state.undoStack.length,
      redoCount: state.redoStack.length,
    };
  },

  /**
   * Clear undo/redo stacks
   */
  clearStacks(documentId: string, userId: string): void {
    const key = `${documentId}_${userId}`;
    undoRedoStates.delete(key);
    console.log("🗑️ [Collab] Stacks cleared", {
      documentId: documentId.substring(0, 8),
    });
  },

  /**
   * Get document activity stats
   */
  async getActivityStats(
    documentId: string,
    timePeriod: "1h" | "24h" | "7d" = "24h"
  ): Promise<any> {
    console.log("📊 [Collab] Getting activity stats", {
      documentId: documentId.substring(0, 8),
    });
    try {
      const now = new Date();
      const cutoffTime = new Date();
      if (timePeriod === "1h") {
        cutoffTime.setHours(cutoffTime.getHours() - 1);
      } else if (timePeriod === "24h") {
        cutoffTime.setDate(cutoffTime.getDate() - 1);
      } else {
        cutoffTime.setDate(cutoffTime.getDate() - 7);
      }

      const { data: changes, error } = await supabase
        .from("document_changes")
        .select(
          "user_id, operation, timestamp, user:users!user_id(id, first_name, last_name)"
        )
        .eq("document_id", documentId)
        .gte("timestamp", cutoffTime.toISOString())
        .lte("timestamp", now.toISOString());

      if (error) {
        console.error("❌ [Collab] Activity stats error", error);
        return null;
      }

      if (!changes || changes.length === 0) {
        return {
          totalChanges: 0,
          changesByUser: [],
          operationTypes: [],
          peakActivity: { hour: 0, count: 0 },
        };
      }

      const changesByUserMap = new Map<string, any>();
      const operationMap = new Map<string, number>();
      const hourlyMap = new Map<number, number>();

      for (const change of changes) {
        const key = (change as any).user_id;
        const userArray = Array.isArray((change as any).user)
          ? (change as any).user
          : [(change as any).user];
        const userName = userArray?.[0]?.first_name || "Unknown";

        if (!changesByUserMap.has(key)) {
          changesByUserMap.set(key, { userId: (change as any).user_id, userName, count: 0 });
        }
        changesByUserMap.get(key).count++;

        const opCount = (operationMap.get((change as any).operation) || 0) + 1;
        operationMap.set((change as any).operation, opCount);

        const hour = new Date((change as any).timestamp).getHours();
        const hourCount = (hourlyMap.get(hour) || 0) + 1;
        hourlyMap.set(hour, hourCount);
      }

      const peakHour = Array.from(hourlyMap.entries()).sort((a, b) => b[1] - a[1])[0];

      console.log("✅ [Collab] Activity stats calculated");
      return {
        totalChanges: changes.length,
        changesByUser: Array.from(changesByUserMap.values())
          .map((u) => ({ ...u, changeCount: u.count }))
          .sort((a, b) => b.changeCount - a.changeCount),
        operationTypes: Array.from(operationMap.entries())
          .map(([op, count]) => ({ operation: op, count }))
          .sort((a, b) => b.count - a.count),
        peakActivity: {
          hour: peakHour?.[0] || 0,
          count: peakHour?.[1] || 0,
        },
      };
    } catch (error) {
      console.error("❌ [Collab Service] Activity stats error", error);
      return null;
    }
  },
};

export default collaborationService;
