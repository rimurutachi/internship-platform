import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import collaborationService from "../services/collaborationService";
import auditService from "../services/auditService";

export async function initializeSession(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { documentId } = req.params;
    const { userName, userEmail } = req.body;

    if (!userName || !userEmail) {
      return res.status(400).json({ success: false, error: "userName and userEmail are required." });
    }

    console.log("🤝 [Collab Controller] Initializing session", {
      documentId: documentId.substring(0, 8),
    });

    const result = await collaborationService.initializeSession(documentId, req.user.id, userName, userEmail);

    await auditService.logAction({
      documentId,
      userId: req.user.id,
      action: "collaboration_session_started",
      metadata: { session_id: result.sessionId },
    });

    console.log("✅ [Collab Controller] Session initialized");

    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error("❌ [Collab Controller] Initialize session error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function endSession(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { documentId, sessionId } = req.params;

    console.log("👋 [Collab Controller] Ending session", {
      documentId: documentId.substring(0, 8),
    });

    const success = await collaborationService.endSession(documentId, req.user.id, sessionId);

    if (!success) {
      return res.status(500).json({ success: false, error: "Failed to end session." });
    }

    await auditService.logAction({
      documentId,
      userId: req.user.id,
      action: "collaboration_session_ended",
      metadata: { session_id: sessionId },
    });

    console.log("✅ [Collab Controller] Session ended");

    return res.json({ success: true, message: "Session ended." });
  } catch (error) {
    console.error("❌ [Collab Controller] End session error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function recordChange(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { documentId } = req.params;
    const { operation, index, content, metadata } = req.body;

    if (!operation || index === undefined) {
      return res.status(400).json({
        success: false,
        error: "operation and index are required.",
      });
    }

    console.log("📝 [Collab Controller] Recording change", {
      documentId: documentId.substring(0, 8),
      operation,
    });

    const success = await collaborationService.recordChange({
      documentId,
      userId: req.user.id,
      operation,
      index,
      content,
      timestamp: new Date().toISOString(),
      metadata,
    });

    if (!success) {
      return res.status(500).json({ success: false, error: "Failed to record change." });
    }

    console.log("✅ [Collab Controller] Change recorded");

    return res.status(201).json({ success: true, message: "Change recorded." });
  } catch (error) {
    console.error("❌ [Collab Controller] Record change error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function getChangeHistory(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { documentId } = req.params;
    const { limit = 100 } = req.query;

    const history = await collaborationService.getChangeHistory(
      documentId,
      Math.min(parseInt(String(limit)), 500)
    );

    return res.json({ success: true, data: history });
  } catch (error) {
    console.error("❌ [Collab Controller] Get history error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function updatePresence(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { documentId } = req.params;
    const { cursorPosition, isEditing } = req.body;

    console.log("👁️ [Collab Controller] Updating presence");

    const success = await collaborationService.updatePresence(documentId, req.user.id, {
      cursorPosition,
      isEditing,
    });

    if (!success) {
      return res.status(400).json({ success: false, error: "Failed to update presence." });
    }

    return res.json({ success: true, message: "Presence updated." });
  } catch (error) {
    console.error("❌ [Collab Controller] Update presence error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function getActiveUsers(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { documentId } = req.params;

    const users = await collaborationService.getActiveUsers(documentId);

    return res.json({ success: true, data: users });
  } catch (error) {
    console.error("❌ [Collab Controller] Get active users error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function undoChange(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { documentId } = req.params;

    console.log("↶ [Collab Controller] Undo request");

    const change = await collaborationService.undo(documentId, req.user.id);

    if (!change) {
      return res.status(400).json({ success: false, error: "Nothing to undo." });
    }

    return res.json({ success: true, data: change });
  } catch (error) {
    console.error("❌ [Collab Controller] Undo error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function redoChange(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { documentId } = req.params;

    console.log("↷ [Collab Controller] Redo request");

    const change = await collaborationService.redo(documentId, req.user.id);

    if (!change) {
      return res.status(400).json({ success: false, error: "Nothing to redo." });
    }

    return res.json({ success: true, data: change });
  } catch (error) {
    console.error("❌ [Collab Controller] Redo error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function getStackStatus(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { documentId } = req.params;

    const status = collaborationService.getStackStatus(documentId, req.user.id);

    return res.json({ success: true, data: status });
  } catch (error) {
    console.error("❌ [Collab Controller] Get stack status error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function getActivityStats(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { documentId } = req.params;
    const { timePeriod = "24h" } = req.query;

    const stats = await collaborationService.getActivityStats(
      documentId,
      (timePeriod as "1h" | "24h" | "7d") || "24h"
    );

    if (!stats) {
      return res.status(500).json({ success: false, error: "Failed to get activity stats." });
    }

    return res.json({ success: true, data: stats });
  } catch (error) {
    console.error("❌ [Collab Controller] Get activity stats error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}
