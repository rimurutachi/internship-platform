"use client";

/**
 * DocumentHighFidelityViewer
 *
 * Mode A of the Hybrid Dual-Mode Document Engine.
 * Renders the original .docx file with 100% layout fidelity using
 * the `docx-preview` library (client-side DOCX-to-HTML renderer).
 *
 * Displays exact MS Word typography, floating images, headers/footers,
 * tables, margins, and page breaks as they appear in the original file.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  FileText,
  Download,
  Loader2,
  AlertCircle,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Edit3,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { documentsAPI } from "@/lib/api/documents";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DocumentHighFidelityViewerProps {
  documentId: string;
  userType: "student" | "advisor" | "supervisor";
  onSwitchToEdit?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DocumentHighFidelityViewer({
  documentId,
  userType,
  onSwitchToEdit,
}: DocumentHighFidelityViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [zoom, setZoom] = useState(100);
  const [isNonDocx, setIsNonDocx] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);

  /**
   * Fetches the original .docx binary from Supabase via signed URL
   * and renders it into the container using docx-preview.
   * If no .docx binary is attached (e.g. template document), falls back to A4 HTML Page rendering.
   */
  const loadDocument = useCallback(async () => {
    if (!documentId) return;

    setLoading(true);
    setError(null);
    setIsNonDocx(false);
    setPdfUrl(null);
    setHtmlContent(null);

    try {
      // Step 1: Get the signed download URL for the primary file
      const { url, fileName: name } =
        await documentsAPI.getDownloadUrl(documentId);
      setFileName(name);

      // Step 2: Determine file type
      const extension = name.split(".").pop()?.toLowerCase();

      if (extension === "pdf") {
        // PDF files: display via native iframe embed
        setIsNonDocx(true);
        setPdfUrl(url);
        setLoading(false);
        return;
      }

      if (extension !== "docx" && extension !== "doc") {
        // Unsupported file type for high-fidelity preview
        setIsNonDocx(true);
        setLoading(false);
        return;
      }

      // Step 3: Fetch the raw binary ArrayBuffer from the signed URL
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `Failed to download document file (HTTP ${response.status})`
        );
      }
      const arrayBuffer = await response.arrayBuffer();

      // Step 4: Dynamically import docx-preview (client-side only)
      const { renderAsync } = await import("docx-preview");

      // Step 5: Render the .docx into the container
      if (containerRef.current) {
        containerRef.current.innerHTML = ""; // Clear previous render
        await renderAsync(arrayBuffer, containerRef.current, undefined, {
          className: "docx-preview-wrapper",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
          experimental: true,
          trimXmlDeclaration: true,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
        });
      }
    } catch (err: any) {
      console.log("ℹ️ [HighFidelityViewer] No binary file or load error:", err?.message);

      // Fallback: If no binary .docx file exists (template document), render HTML A4 Page
      if (err?.message?.includes("does not have a file attached yet") || err?.message?.includes("upload a file first")) {
        try {
          const doc = await documentsAPI.getDocument(documentId);
          setFileName(doc.title || "Template Document");
          const html = typeof doc.content === "string"
            ? doc.content
            : doc.content?.html || "<p>No content available.</p>";
          setHtmlContent(html);
          return;
        } catch (fetchErr) {
          console.error("❌ [HighFidelityViewer] Failed to fetch doc content:", fetchErr);
        }
      }

      setError(
        err instanceof Error ? err.message : "Failed to render document preview"
      );
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  // ── Zoom handlers ──────────────────────────────────────────────────────────
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 15, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 15, 50));
  const handleZoomReset = () => setZoom(100);

  // ── Download handler ───────────────────────────────────────────────────────
  const handleDownload = async () => {
    try {
      const { url, fileName: name } =
        await documentsAPI.getDownloadUrl(documentId);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("❌ [HighFidelityViewer] Download failed:", err);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      {/* ── Viewer Toolbar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="w-4 h-4" />
          <span className="font-medium truncate max-w-[300px]">
            {fileName || "Loading..."}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Zoom Controls */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            className="h-8 w-8 p-0"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <button
            onClick={handleZoomReset}
            className="px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded"
          >
            {zoom}%
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= 200}
            className="h-8 w-8 p-0"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Download */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-8 gap-1.5 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </Button>

          {/* Reload */}
          <Button
            variant="ghost"
            size="sm"
            onClick={loadDocument}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* ── Document Preview Area ──────────────────────────────────────── */}
      <div className="flex-1 overflow-auto bg-muted/30 dark:bg-muted/10">
        {loading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 animate-in fade-in">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Rendering high-fidelity preview...
            </p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-full gap-4 p-8 animate-in fade-in">
            {error.includes("does not have a file attached yet") || error.includes("upload a file first") ? (
              <>
                <div className="p-4 rounded-full bg-primary/10">
                  <FileText className="w-10 h-10 text-primary" />
                </div>
                <div className="text-center space-y-1.5 max-w-[420px]">
                  <p className="text-base font-semibold text-foreground">
                    Text-Based Document
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This document was generated from a template. You can view, edit, and fill out its content in Edit Mode.
                  </p>
                </div>
                {onSwitchToEdit && (
                  <Button
                    onClick={onSwitchToEdit}
                    className="gap-2 bg-primary hover:bg-primary/90 mt-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Switch to Edit Content Mode
                  </Button>
                )}
              </>
            ) : (
              <>
                <div className="p-3 rounded-full bg-destructive/10">
                  <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-destructive">
                    Preview Unavailable
                  </p>
                  <p className="text-xs text-muted-foreground max-w-[400px]">
                    {error}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadDocument}
                  className="gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry
                </Button>
              </>
            )}
          </div>
        )}

        {/* PDF fallback: use iframe */}
        {!loading && !error && isNonDocx && pdfUrl && (
          <iframe
            src={pdfUrl}
            className="w-full h-full border-none"
            title="PDF Preview"
          />
        )}

        {/* Non-docx, non-pdf: show unsupported message */}
        {!loading && !error && isNonDocx && !pdfUrl && (
          <div className="flex flex-col items-center justify-center h-full gap-4 p-8 animate-in fade-in">
            <FileText className="w-12 h-12 text-muted-foreground/50" />
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">
                High-fidelity preview is available for .docx and .pdf files
              </p>
              <p className="text-xs text-muted-foreground">
                You can still download this file or switch to Edit Mode.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download File
            </Button>
          </div>
        )}

        {/* HTML A4 Paper preview container (for template-generated documents without .docx file) */}
        {!loading && !error && htmlContent && (
          <div
            className="flex justify-center py-6 px-4"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
            }}
          >
            <div className="a4-paper bg-white text-gray-900 shadow-2xl rounded-sm p-16 w-[794px] min-h-[1123px] border border-gray-200">
              <div
                className="prose max-w-none text-black font-sans leading-relaxed"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </div>
          </div>
        )}

        {/* DOCX preview container */}
        {!isNonDocx && !htmlContent && (
          <div
            className="flex justify-center py-6 px-4"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
            }}
          >
            <div
              ref={containerRef}
              className="docx-container bg-white shadow-lg"
            />
          </div>
        )}
      </div>

      {/* ── docx-preview Styles ────────────────────────────────────────── */}
      <style>{`
        .docx-container {
          max-width: 100%;
        }
        .docx-container .docx-preview-wrapper {
          padding: 0;
        }
        .docx-container .docx-preview-wrapper > section.docx {
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          margin-bottom: 24px;
          background: white;
          /* Page break visual separation */
          page-break-after: always;
        }
        .docx-container .docx-preview-wrapper > section.docx:last-child {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
}

export default DocumentHighFidelityViewer;
