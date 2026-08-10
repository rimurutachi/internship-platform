"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * CollaborativeEditor
 *
 * Real-time collaborative rich text editor for the Hybrid Document Workflow.
 * Uses Tiptap + Yjs for CRDT-based editing and Socket.io for transport.
 *
 * Architecture:
 * - Yjs Y.Doc is the source of truth for document content
 * - Tiptap's Collaboration extension binds directly to Y.XmlFragment('content')
 * - Socket.io transports Yjs binary updates (NOT y-websocket provider)
 * - Presence (cursors, active users) is tracked via socket events
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Collaboration from "@tiptap/extension-collaboration";
import ImageResize from "tiptap-extension-resize-image";
import FontFamily from "@tiptap/extension-font-family";
import { Color } from "@tiptap/extension-color";
import { TextStyle, FontSize, LineHeight } from "@tiptap/extension-text-style";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { Extension } from "@tiptap/core";
import { io, Socket } from "socket.io-client";
import * as Y from "yjs";
import {
  ArrowLeft,
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Lock,
  Loader2,
  Users,
  Circle,
  Wifi,
  WifiOff,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Image as ImageIcon,
  Table as TableIcon,
  Plus,
  Trash2,
  Square,
  PaintBucket,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUser } from "@/hooks/use-user";
import { createSupabaseClient } from "@/lib/supabase";
import { documentsAPI } from "@/lib/api/documents";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CollaborativeEditorProps {
  documentId: string;
  userType: "student" | "advisor" | "supervisor";
}

/** Active collaborator presence data */
interface ActiveUser {
  userId: string;
  userName: string;
  userEmail: string;
  color: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

/** Document-service WebSocket URL */
const DOCUMENT_SERVICE_URL =
  process.env.NEXT_PUBLIC_DOCUMENT_SERVICE_URL || "http://localhost:6001";

/** Palette for collaborator avatar colors */
const COLLABORATOR_COLORS = [
  "#16a34a", // CvSU green
  "#f59e0b", // gold
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#6366f1", // indigo
];

// Custom Image with Word-like text wrapping modes
// Works by generating the correct wrapperStyle and containerStyle that
// tiptap-extension-resize-image uses for its DOM (wrapper > container > img).
//
// Wrapping modes:
//   inline       – default block flow
//   square-left  – float left with comfortable margin
//   square-right – float right with comfortable margin
//   tight-left   – float left with tight margin
//   tight-right  – float right with tight margin
//   top-bottom   – centered block, text only above/below
//   in-front     – overlays on top of text
//   behind       – sits behind text (watermark-like)

/** Maps a wrapping mode → wrapper CSS, container CSS */
const WRAPPING_STYLES: Record<string, { wrapper: string; container: string }> = {
  inline: {
    wrapper: "display: inline-block; margin: 0;",
    container: "",
  },
  "square-left": {
    wrapper: "display: block; float: left; margin: 0 1rem 0.5rem 0; clear: left;",
    container: "",
  },
  "square-right": {
    wrapper: "display: block; float: right; margin: 0 0 0.5rem 1rem; clear: right;",
    container: "",
  },
  "tight-left": {
    wrapper: "display: block; float: left; margin: 0 8px 4px 0; clear: left;",
    container: "",
  },
  "tight-right": {
    wrapper: "display: block; float: right; margin: 0 0 4px 8px; clear: right;",
    container: "",
  },
  "top-bottom": {
    wrapper: "display: flex; justify-content: center; margin: 1rem 0; clear: both;",
    container: "",
  },
  "in-front": {
    wrapper: "display: inline-block; position: relative; z-index: 10; margin: 0;",
    container: "",
  },
  behind: {
    wrapper: "display: inline-block; position: relative; z-index: -1; opacity: 0.3; margin: 0;",
    container: "",
  },
};

const CustomImage = ImageResize.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      wrapping: {
        default: "inline",
        parseHTML: (element) =>
          element.getAttribute("data-wrapping") || "inline",
        renderHTML: (attributes) => {
          const mode = attributes.wrapping || "inline";
          const styles = WRAPPING_STYLES[mode] || WRAPPING_STYLES.inline;

          // Merge our wrapping wrapper/container CSS with the library's
          // existing width/height in containerStyle
          const existingContainer = (attributes.containerStyle || "") as string;
          // Extract width from existing containerStyle
          const widthMatch = existingContainer.match(/width:\s*[^;]+;/);
          const widthCss = widthMatch ? widthMatch[0] : "";
          const heightCss = "height: auto; cursor: pointer;";

          return {
            "data-wrapping": mode,
            wrapperStyle: styles.wrapper,
            containerStyle: `${widthCss} ${heightCss} ${styles.container}`.trim(),
          };
        },
      },
    };
  },
});

// Custom Table Cell with background color support
const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: (element) => element.style.backgroundColor || null,
        renderHTML: (attributes) => {
          if (!attributes.backgroundColor) return {};
          return { style: `background-color: ${attributes.backgroundColor}` };
        },
      },
    };
  },
});

// Custom Table with borderless toggle support
const CustomTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      borderless: {
        default: false,
        parseHTML: (element) => element.getAttribute("data-borderless") === "true",
        renderHTML: (attributes) => {
          if (!attributes.borderless) return {};
          return { "data-borderless": "true", class: "borderless-table" };
        },
      },
    };
  },
});

// Custom Tab handler extension to insert tab character like a word processor
const TabHandler = Extension.create({
  name: "tabHandler",
  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        // If in a list, let Tiptap's default list handler indent it
        if (editor.can().sinkListItem("listItem")) {
          return false;
        }
        // Otherwise insert a literal tab character
        return editor.commands.insertContent("\t");
      },
    };
  },
});

// ─── Component ─────────────────────────────────────────────────────────────────

export function CollaborativeEditor({
  documentId,
  userType,
}: CollaborativeEditorProps) {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  // ── State ──────────────────────────────────────────────────────────────────
  const [documentTitle, setDocumentTitle] = useState<string>("");
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [loadingDoc, setLoadingDoc] = useState(true);
  const [initialHtml, setInitialHtml] = useState<string | null>(null);
  const [initialHeaderHtml, setInitialHeaderHtml] = useState<string | null>(null);
  const [initialFooterHtml, setInitialFooterHtml] = useState<string | null>(null);

  // ── Refs (stable across renders) ───────────────────────────────────────────
  const socketRef = useRef<Socket | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const isLocalUpdateRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Yjs Document (created once) ────────────────────────────────────────────
  const ydoc = useRef<Y.Doc>(new Y.Doc()).current;
  useEffect(() => {
    ydocRef.current = ydoc;
  }, [ydoc]);

  // ── Shared Editor Extensions ─────────────────────────────────────────────────
  const getExtensions = useCallback((fragmentName: string) => [
    StarterKit.configure({
      // Disable the built-in history since Yjs manages its own undo stack
      history: false,
    } as any),
    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
    TextStyle,
    Color,
    FontSize,
    LineHeight,
    FontFamily.configure({
      types: ["textStyle"],
    }),
    CustomImage,
    CustomTable.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    CustomTableCell,
    TabHandler,
    Collaboration.configure({
      document: ydoc,
      fragment: ydoc.getXmlFragment(fragmentName),
    }),
  ], [ydoc]);

  // ── Tiptap Editors ──────────────────────────────────────────────────────────
  const editor = useEditor({
    extensions: getExtensions("content"),
    editable: !isReadOnly,
    autofocus: "end",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[500px] px-24 py-4",
      },
    },
  });

  const headerEditor = useEditor({
    extensions: getExtensions("header"),
    editable: !isReadOnly,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[100px] px-24 pt-24 pb-4 text-muted-foreground border-b border-dashed border-border/50 opacity-60 hover:opacity-100 transition-opacity focus-within:opacity-100",
      },
    },
  });

  const footerEditor = useEditor({
    extensions: getExtensions("footer"),
    editable: !isReadOnly,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[100px] px-24 pt-4 pb-24 text-muted-foreground border-t border-dashed border-border/50 opacity-60 hover:opacity-100 transition-opacity focus-within:opacity-100",
      },
    },
  });

  // Sync read-only state with all editors
  useEffect(() => {
    if (editor) editor.setEditable(!isReadOnly);
    if (headerEditor) headerEditor.setEditable(!isReadOnly);
    if (footerEditor) footerEditor.setEditable(!isReadOnly);
  }, [editor, headerEditor, footerEditor, isReadOnly]);

  // Keep a stable ref to the editor for use in closures
  const editorRef = useRef<any>(null);
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Apply initial HTML from docx if the editors are empty
  const initTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (editor && headerEditor && footerEditor && isConnected) {
      if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);

      initTimeoutRef.current = setTimeout(() => {
        const fragment = ydoc.getXmlFragment("content");
        if (fragment.length === 0 || editor.isEmpty) {
          if (initialHtml) editor.commands.setContent(initialHtml);
          if (initialHeaderHtml) headerEditor.commands.setContent(initialHeaderHtml);
          if (initialFooterHtml) footerEditor.commands.setContent(initialFooterHtml);
          console.log("📝 [Editor] Initialized content from docx HTML");
        }
      }, 800); // Wait for Yjs sync

      return () => {
        if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
      };
    }
  }, [editor, headerEditor, footerEditor, initialHtml, initialHeaderHtml, initialFooterHtml, isConnected, ydoc]);

  // ── Fetch document metadata ────────────────────────────────────────────────
  useEffect(() => {
    async function fetchDocument() {
      try {
        setLoadingDoc(true);
        const doc = await documentsAPI.getDocument(documentId);
        setDocumentTitle(doc.title || "Untitled Document");

        if (doc.content?.html) {
          setInitialHtml(doc.content.html);
        }
        if (doc.content?.headerHtml) {
          setInitialHeaderHtml(doc.content.headerHtml);
        }
        if (doc.content?.footerHtml) {
          setInitialFooterHtml(doc.content.footerHtml);
        }

        // If the document is already pre_approved, lock it immediately
        if ((doc.status as any) === "pre_approved" || doc.status === "approved") {
          setIsReadOnly(true);
        }
      } catch (err) {
        console.error("❌ [Editor] Failed to fetch document:", err);
        setDocumentTitle("Document");
      } finally {
        setLoadingDoc(false);
      }
    }
    fetchDocument();
  }, [documentId]);

  // ── Socket.io connection & Yjs sync ────────────────────────────────────────
  const connectSocket = useCallback(async () => {
    if (!user) return;

    try {
      const supabase = createSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        console.error("❌ [Editor] No auth token available");
        return;
      }

      // Connect to document-service WebSocket
      const socket = io(DOCUMENT_SERVICE_URL, {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      socketRef.current = socket;
      ydocRef.current = ydoc;

      // ── Connection lifecycle ─────────────────────────────────────────────
      socket.on("connect", () => {
        console.log("🟢 [Editor] Socket connected");
        setIsConnected(true);

        // Join the document room
        socket.emit("document:join", {
          documentId,
          userId: user.id,
          userName:
            `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
            user.email,
          userEmail: user.email,
        });
      });

      socket.on("disconnect", () => {
        console.log("🔴 [Editor] Socket disconnected");
        setIsConnected(false);
      });

      socket.on("connect_error", (err) => {
        console.error("❌ [Editor] Socket connection error:", err.message);
        setIsConnected(false);
      });

      // ── Incoming Yjs updates from other collaborators ────────────────────
      socket.on(
        "document:update",
        (data: { update: ArrayBuffer | number[] }) => {
          try {
            // Convert the incoming update to Uint8Array
            const update =
              data.update instanceof ArrayBuffer
                ? new Uint8Array(data.update)
                : new Uint8Array(data.update);

            // Flag to prevent echoing this update back to the server
            isLocalUpdateRef.current = false;
            Y.applyUpdate(ydoc, update, "remote");
          } catch (err) {
            console.error("❌ [Editor] Failed to apply remote update:", err);
          }
        },
      );

      // ── Read-only lock (pre-approved documents) ──────────────────────────
      socket.on("document:readonly", () => {
        console.log("🔒 [Editor] Document is now read-only");
        setIsReadOnly(true);
      });

      // ── Presence events ──────────────────────────────────────────────────
      socket.on("active:users", (users: ActiveUser[]) => {
        setActiveUsers(users);
      });

      socket.on("user:joined", (joinedUser: ActiveUser) => {
        setActiveUsers((prev) => {
          // Filter out existing entries for the same user ID to prevent duplicates
          const filtered = prev.filter((u) => u.userId !== joinedUser.userId);
          return [...filtered, joinedUser];
        });
      });

      socket.on("user:left", (leftUser: { userId: string }) => {
        setActiveUsers((prev) =>
          prev.filter((u) => u.userId !== leftUser.userId),
        );
      });

      socket.on("cursor:update", (_cursorData: any) => {
        // Cursor rendering is handled by CollaborationCursor extension
        // if added in the future. For now, presence is shown via avatar dots.
      });

      // ── Local Yjs updates → broadcast to other collaborators ─────────────
      ydoc.on("update", (update: Uint8Array, origin: any) => {
        // Only broadcast updates that originated locally (not from remote sync)
        if (origin !== "remote" && socket.connected) {
          socket.emit("document:update", {
            documentId,
            userId: user.id,
            update: Array.from(update),
          });

          // Show saving indicator
          setIsSaving(true);
          if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = setTimeout(() => {
            setIsSaving(false);
            // Save the actual HTML to the server so it persists to the DB
            if (editorRef.current) {
              const html = editorRef.current.getHTML();
              socket.emit("document:save", {
                documentId,
                htmlContent: html,
              });
            }
          }, 1500);
        }
      });
    } catch (err) {
      console.error("❌ [Editor] Failed to connect socket:", err);
    }
  }, [user, documentId, ydoc]);

  // Establish socket connection when user is available
  useEffect(() => {
    if (user && !userLoading) {
      connectSocket();
    }

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.emit("document:leave", { documentId });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (ydocRef.current) {
        ydocRef.current.destroy();
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [user, userLoading, connectSocket, documentId]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const handleBack = () => {
    router.push(`/dashboard/${userType}/documents`);
  };

  // ── Get collaborator color by index ────────────────────────────────────────
  const getCollaboratorColor = (index: number) =>
    COLLABORATOR_COLORS[index % COLLABORATOR_COLORS.length];

  // ── Get user initials for avatar ───────────────────────────────────────────
  const getUserInitials = (name: string) => {
    if (!name) return "??";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (userLoading || loadingDoc) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted">
        <div className="flex flex-col items-center gap-4 animate-in">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading editor...</p>
        </div>
      </div>
    );
  }

  // ── Handlers ───────────────────────────────────────────────────────────────
  const addImage = () => {
    if (!editor) return;
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          editor.chain().focus().setImage({ src: result }).run();
        };
        reader.readAsDataURL(file);
      }
    };
    fileInput.click();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-muted flex flex-col">
        {/* ─── Top Bar ──────────────────────────────────────────────────────── */}
        <header className="bg-card border-b border-border sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto w-full">
            {/* Left: Back + Title */}
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-foreground truncate">
                  {documentTitle}
                </h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {/* Connection indicator */}
                  {isConnected ? (
                    <span className="flex items-center gap-1 text-emerald-600">
                      <Wifi className="w-3 h-3" />
                      Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-destructive">
                      <WifiOff className="w-3 h-3" />
                      Disconnected
                    </span>
                  )}
                  <span className="text-border">•</span>
                  {/* Save indicator */}
                  <span>
                    {isSaving ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      "All changes saved"
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Active Users */}
            <div className="flex items-center gap-3">
              {activeUsers.length > 0 && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <div className="flex -space-x-2">
                    {activeUsers.slice(0, 5).map((collaborator, idx) => (
                      <Tooltip key={collaborator.userId}>
                        <TooltipTrigger asChild>
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-card cursor-default"
                            style={{
                              backgroundColor: getCollaboratorColor(idx),
                            }}
                          >
                            {getUserInitials(collaborator.userName)}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{collaborator.userName}</p>
                          <p className="text-xs text-muted-foreground">
                            {collaborator.userEmail}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    {activeUsers.length > 5 && (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted text-foreground text-xs font-bold border-2 border-card">
                        +{activeUsers.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Role badge */}
              <Badge
                variant="outline"
                className="capitalize hidden sm:inline-flex"
              >
                {userType}
              </Badge>
            </div>
          </div>
        </header>

        {/* ─── Read-Only Lock Banner ────────────────────────────────────────── */}
        {isReadOnly && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
              <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                🔒 This document has been pre-approved and is content-locked.
              </p>
            </div>
          </div>
        )}

        {/* ─── Toolbar ──────────────────────────────────────────────────────── */}
        {!isReadOnly && editor && (
          <div className="bg-muted border-b border-border sticky top-[57px] z-20">
            <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center gap-1 overflow-x-auto">
              {/* Font Family Dropdown */}
              <select
                className="h-8 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-accent hover:text-accent-foreground cursor-pointer"
                onChange={(e) => {
                  const font = e.target.value;
                  if (font) {
                    editor.chain().focus().setFontFamily(font).run();
                  } else {
                    editor.chain().focus().unsetFontFamily().run();
                  }
                }}
                value={editor.getAttributes("textStyle").fontFamily || ""}
              >
                <option value="">Default Font</option>
                <option value="Inter">Inter</option>
                <option value="Arial">Arial</option>
                <option value="'Times New Roman'">Times New Roman</option>
                <option value="'Courier New'">Courier New</option>
                <option value="Georgia">Georgia</option>
                <option value="Verdana">Verdana</option>
              </select>

              {/* Font Size Dropdown */}
              <select
                className="h-8 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-accent hover:text-accent-foreground cursor-pointer"
                onChange={(e) => {
                  const size = e.target.value;
                  if (size) {
                    editor.chain().focus().setFontSize(size).run();
                  } else {
                    editor.chain().focus().unsetFontSize().run();
                  }
                }}
                value={editor.getAttributes("textStyle").fontSize || ""}
              >
                <option value="">Size</option>
                <option value="12px">12</option>
                <option value="14px">14</option>
                <option value="16px">16</option>
                <option value="18px">18</option>
                <option value="20px">20</option>
                <option value="24px">24</option>
                <option value="30px">30</option>
              </select>

              {/* Line Height Dropdown */}
              <select
                className="h-8 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-accent hover:text-accent-foreground cursor-pointer"
                onChange={(e) => {
                  const height = e.target.value;
                  if (height) {
                    editor.chain().focus().setLineHeight(height).run();
                  } else {
                    editor.chain().focus().unsetLineHeight().run();
                  }
                }}
                value={editor.getAttributes("textStyle").lineHeight || ""}
              >
                <option value="">Spacing</option>
                <option value="1">Single</option>
                <option value="1.15">1.15</option>
                <option value="1.5">1.5</option>
                <option value="2">Double</option>
              </select>

              {/* Color Picker */}
              <div className="flex items-center gap-1 border border-input rounded-md px-1 h-8 bg-transparent shadow-sm hover:bg-accent transition-colors">
                <input
                  type="color"
                  className="w-5 h-5 p-0 border-0 bg-transparent cursor-pointer rounded-sm"
                  onInput={(e) => {
                    editor
                      .chain()
                      .focus()
                      .setColor((e.target as HTMLInputElement).value)
                      .run();
                  }}
                  value={editor.getAttributes("textStyle").color || "#000000"}
                  title="Font Color"
                />
              </div>

              <ToolbarDivider />

              <ToolbarDivider />

              <ToolbarButton
                icon={<Bold className="w-4 h-4" />}
                label="Bold"
                isActive={editor.isActive("bold")}
                onClick={() => editor.chain().focus().toggleBold().run()}
              />
              <ToolbarButton
                icon={<Italic className="w-4 h-4" />}
                label="Italic"
                isActive={editor.isActive("italic")}
                onClick={() => editor.chain().focus().toggleItalic().run()}
              />
              <ToolbarButton
                icon={<Underline className="w-4 h-4" />}
                label="Underline"
                isActive={false}
                onClick={() => {
                  // Underline is not in StarterKit by default;
                  // chain a mark toggle if the extension is added later
                  editor.chain().focus().run();
                }}
                disabled
              />

              <ToolbarDivider />

              <ToolbarButton
                icon={<Heading1 className="w-4 h-4" />}
                label="Heading 1"
                isActive={editor.isActive("heading", { level: 1 })}
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
              />
              <ToolbarButton
                icon={<Heading2 className="w-4 h-4" />}
                label="Heading 2"
                isActive={editor.isActive("heading", { level: 2 })}
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
              />
              <ToolbarButton
                icon={<Heading3 className="w-4 h-4" />}
                label="Heading 3"
                isActive={editor.isActive("heading", { level: 3 })}
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 3 }).run()
                }
              />

              <ToolbarDivider />

              <ToolbarButton
                icon={<List className="w-4 h-4" />}
                label="Bullet List"
                isActive={editor.isActive("bulletList")}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
              />
              <ToolbarButton
                icon={<ListOrdered className="w-4 h-4" />}
                label="Ordered List"
                isActive={editor.isActive("orderedList")}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
              />
              <ToolbarButton
                icon={<Quote className="w-4 h-4" />}
                label="Blockquote"
                isActive={editor.isActive("blockquote")}
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
              />
              <ToolbarButton
                icon={<Minus className="w-4 h-4" />}
                label="Horizontal Rule"
                isActive={false}
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
              />

              <ToolbarDivider />

              <ToolbarButton
                icon={<ImageIcon className="w-4 h-4" />}
                label="Insert Image"
                isActive={false}
                onClick={addImage}
              />
              {editor.isActive("image") && (() => {
                const currentWrap = editor.getAttributes("image").wrapping || "inline";
                const setWrap = (mode: string) =>
                  editor.chain().focus().updateAttributes("image", { wrapping: mode }).run();
                const wrappingOptions = [
                  { value: "inline", label: "Inline", icon: <AlignJustify className="w-3.5 h-3.5" /> },
                  { value: "square-left", label: "Square Left", icon: <AlignLeft className="w-3.5 h-3.5" /> },
                  { value: "square-right", label: "Square Right", icon: <AlignRight className="w-3.5 h-3.5" /> },
                  { value: "tight-left", label: "Tight Left", icon: <AlignLeft className="w-3.5 h-3.5" /> },
                  { value: "tight-right", label: "Tight Right", icon: <AlignRight className="w-3.5 h-3.5" /> },
                  { value: "top-bottom", label: "Top & Bottom", icon: <AlignCenter className="w-3.5 h-3.5" /> },
                  { value: "in-front", label: "In Front of Text", icon: <Square className="w-3.5 h-3.5" /> },
                  { value: "behind", label: "Behind Text", icon: <Square className="w-3.5 h-3.5 opacity-40" /> },
                ];
                return (
                  <div className="relative group">
                    <ToolbarButton
                      icon={<ImageIcon className="w-4 h-4" />}
                      label="Text Wrapping"
                      isActive={currentWrap !== "inline"}
                      onClick={() => {}}
                    />
                    <div className="absolute top-full left-0 z-50 hidden group-hover:flex flex-col bg-popover border border-border rounded-lg shadow-xl p-1.5 min-w-[180px] animate-in fade-in-0 zoom-in-95">
                      <span className="px-2 py-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Text Wrapping</span>
                      {wrappingOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setWrap(opt.value)}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                            currentWrap === opt.value
                              ? "bg-primary/15 text-primary font-medium"
                              : "text-foreground hover:bg-accent"
                          }`}
                        >
                          {opt.icon}
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
              <ToolbarButton
                icon={<TableIcon className="w-4 h-4" />}
                label="Insert Table"
                isActive={editor.isActive("table")}
                onClick={() =>
                  editor
                    .chain()
                    .focus()
                    .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                    .run()
                }
              />
              {editor.isActive("table") && (
                <>
                  <ToolbarButton
                    icon={<Plus className="w-4 h-4" />}
                    label="Add Row Below"
                    isActive={false}
                    onClick={() => editor.chain().focus().addRowAfter().run()}
                  />
                  <ToolbarButton
                    icon={<Trash2 className="w-4 h-4 text-destructive" />}
                    label="Delete Row"
                    isActive={false}
                    onClick={() => editor.chain().focus().deleteRow().run()}
                  />
                  <ToolbarButton
                    icon={<Plus className="w-4 h-4" />}
                    label="Add Column After"
                    isActive={false}
                    onClick={() =>
                      editor.chain().focus().addColumnAfter().run()
                    }
                  />
                  <ToolbarButton
                    icon={<Trash2 className="w-4 h-4 text-destructive" />}
                    label="Delete Column"
                    isActive={false}
                    onClick={() => editor.chain().focus().deleteColumn().run()}
                  />
                  <ToolbarButton
                    icon={<Trash2 className="w-4 h-4 text-destructive" />}
                    label="Delete Table"
                    isActive={false}
                    onClick={() => editor.chain().focus().deleteTable().run()}
                  />
                  <ToolbarButton
                    icon={<Square className="w-4 h-4" />}
                    label="Toggle Borders"
                    isActive={editor.getAttributes("table").borderless}
                    onClick={() => {
                      const isBorderless = editor.getAttributes("table").borderless;
                      editor.chain().focus().updateAttributes("table", { borderless: !isBorderless }).run();
                    }}
                  />
                  <div className="relative flex items-center justify-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-8 h-8 p-0 relative">
                          <PaintBucket className="w-4 h-4" />
                          <input
                            type="color"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            title="Cell Background Color"
                            onChange={(e) => {
                              editor.chain().focus().updateAttributes("tableCell", { backgroundColor: e.target.value }).run();
                            }}
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Cell Background Color</TooltipContent>
                    </Tooltip>
                  </div>
                </>
              )}

              <ToolbarDivider />

              <ToolbarButton
                icon={<AlignLeft className="w-4 h-4" />}
                label="Align Left"
                isActive={editor.isActive({ textAlign: "left" })}
                onClick={() =>
                  editor.chain().focus().setTextAlign("left").run()
                }
              />
              <ToolbarButton
                icon={<AlignCenter className="w-4 h-4" />}
                label="Align Center"
                isActive={editor.isActive({ textAlign: "center" })}
                onClick={() =>
                  editor.chain().focus().setTextAlign("center").run()
                }
              />
              <ToolbarButton
                icon={<AlignRight className="w-4 h-4" />}
                label="Align Right"
                isActive={editor.isActive({ textAlign: "right" })}
                onClick={() =>
                  editor.chain().focus().setTextAlign("right").run()
                }
              />
              <ToolbarButton
                icon={<AlignJustify className="w-4 h-4" />}
                label="Justify"
                isActive={editor.isActive({ textAlign: "justify" })}
                onClick={() =>
                  editor.chain().focus().setTextAlign("justify").run()
                }
              />
            </div>
          </div>
        )}

        {/* ─── Editor Content ───────────────────────────────────────────────── */}
        <div className="flex-1 flex justify-center py-8 px-4 bg-muted/20 dark:bg-muted/10 overflow-y-auto">
          <div
            className="w-full max-w-[816px] bg-white dark:bg-card border border-border/50 shadow-md animate-in flex flex-col"
            style={{ minHeight: "1056px" }}
          >
            {/* Header Editor Zone */}
            <div className="w-full shrink-0">
              <EditorContent editor={headerEditor} />
            </div>

            {/* Main Body Editor Zone */}
            <div className="w-full flex-1">
              <EditorContent editor={editor} />
            </div>

            {/* Footer Editor Zone */}
            <div className="w-full shrink-0">
              <EditorContent editor={footerEditor} />
            </div>

            {/* Inline ProseMirror styles for clean typography */}
            <style>{`
              .ProseMirror {
                outline: none;
                min-height: 100%;
                font-family: Arial, "Times New Roman", sans-serif;
                font-size: 11pt;
                line-height: 1.25;
                tab-size: 4; /* Standard word processor tab spacing */
              }
              .ProseMirror p {
                margin: 4px 0; /* Word-like tight paragraph spacing */
                line-height: inherit;
                font-family: inherit;
                font-size: inherit;
              }
              .ProseMirror img {
                max-width: 100%;
                height: auto;
                display: inline-block;
              }
              /*
               * Image wrapping is handled via wrapperStyle/containerStyle
               * inline attributes on the library's wrapper divs (see CustomImage).
               * Only supplementary CSS needed here:
               */
              .ProseMirror img.ProseMirror-selectednode {
                outline: 3px solid #3b82f6;
              }
              /* Clearfix: ensures paragraphs after floated images clear properly */
              .ProseMirror p::after {
                content: "";
                display: table;
                clear: both;
              }
              .ProseMirror table {
                border-collapse: collapse;
                table-layout: fixed;
                width: 100%;
                margin: 0;
                overflow: hidden;
              }
              .ProseMirror table td,
              .ProseMirror table th {
                min-width: 1em;
                border: 2px solid #ced4da;
                padding: 3px 5px;
                vertical-align: top;
                box-sizing: border-box;
                position: relative;
              }
              .ProseMirror table.borderless-table td,
              .ProseMirror table.borderless-table th {
                border: 1px dashed #e5e7eb;
              }
              .ProseMirror table th {
                font-weight: bold;
                text-align: left;
                background-color: #f1f3f5;
              }
              .ProseMirror table .selectedCell:after {
                z-index: 2;
                position: absolute;
                content: "";
                left: 0; right: 0; top: 0; bottom: 0;
                background: rgba(200, 200, 255, 0.4);
                pointer-events: none;
              }
              .ProseMirror table .column-resize-handle {
                position: absolute;
                right: -2px;
                top: 0;
                bottom: -2px;
                width: 4px;
                background-color: #adf;
                pointer-events: none;
              }
              .ProseMirror p[style*="text-align: center"] {
                text-align: center;
              }
              .ProseMirror h1 {
                font-size: 1.875rem;
                font-weight: 700;
                margin: 1.25em 0 0.5em;
                line-height: 1.3;
              }
              .ProseMirror h2 {
                font-size: 1.5rem;
                font-weight: 600;
                margin: 1.1em 0 0.4em;
                line-height: 1.35;
              }
              .ProseMirror h3 {
                font-size: 1.25rem;
                font-weight: 600;
                margin: 1em 0 0.35em;
                line-height: 1.4;
              }
              .ProseMirror ul,
              .ProseMirror ol {
                padding-left: 2em;
                margin: 4px 0;
              }
              .ProseMirror li {
                margin: 2px 0;
              }
              .ProseMirror ol {
                list-style-type: decimal;
              }
              .ProseMirror ol ol {
                list-style-type: lower-alpha;
              }
              .ProseMirror ol ol ol {
                list-style-type: lower-roman;
              }
              .ProseMirror ol ol ol ol {
                list-style-type: decimal;
              }
              .ProseMirror blockquote {
                border-left: 3px solid #16a34a;
                padding-left: 1em;
                margin: 1em 0;
                color: var(--muted-foreground, #6b7280);
                font-style: italic;
              }
              .ProseMirror hr {
                border: none;
                border-top: 2px solid var(--border, #e5e7eb);
                margin: 1.5em 0;
              }
              .ProseMirror code {
                background: var(--muted, #f3f4f6);
                padding: 0.15em 0.4em;
                border-radius: 4px;
                font-size: 0.9em;
              }
              .ProseMirror pre {
                background: var(--muted, #f3f4f6);
                padding: 1em;
                border-radius: 8px;
                overflow-x: auto;
                margin: 1em 0;
              }
              .ProseMirror .collaboration-cursor__caret {
                border-left: 2px solid;
                position: relative;
              }
              .ProseMirror .collaboration-cursor__label {
                font-size: 0.7rem;
                padding: 1px 4px;
                border-radius: 3px;
                color: white;
                position: absolute;
                top: -1.4em;
                left: -1px;
                white-space: nowrap;
                pointer-events: none;
              }
            `}</style>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// ─── Toolbar Sub-Components ──────────────────────────────────────────────────

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}

/** Individual toolbar button with tooltip */
function ToolbarButton({
  icon,
  label,
  isActive,
  onClick,
  disabled = false,
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={`
            p-2 rounded-md transition-colors
            ${
              isActive
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }
            ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

/** Vertical divider between toolbar groups */
function ToolbarDivider() {
  return <div className="w-px h-6 bg-border mx-1" />;
}

export default CollaborativeEditor;
