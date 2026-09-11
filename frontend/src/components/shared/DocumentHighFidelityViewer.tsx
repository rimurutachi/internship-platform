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
  Maximize2,
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
  const viewerWrapperRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [zoom, setZoom] = useState(100);
  const [isAutoFit, setIsAutoFit] = useState(true);
  const [docWidth, setDocWidth] = useState<number>(816);
  const [docHeight, setDocHeight] = useState<number>(1056);
  const [isNonDocx, setIsNonDocx] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);

  /** Calculate fit-to-width zoom percentage based on current container width */
  const calculateFitZoom = useCallback((targetWidth: number) => {
    const wrapperWidth = viewerWrapperRef.current?.clientWidth || (typeof window !== "undefined" ? window.innerWidth : 800);
    // Padding allowance: 16px on mobile (<640px), 32px on larger screens
    const padding = wrapperWidth < 640 ? 16 : 32;
    const availableWidth = wrapperWidth - padding;
    if (availableWidth <= 0) return 100;

    // Scale percentage so the document fits within viewport width
    const scale = Math.floor((availableWidth / targetWidth) * 100);
    // Allow between 25% and 100% (capping at 100% on desktop to prevent over-scaling)
    return Math.max(25, Math.min(100, scale));
  }, []);

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

        // Measure document dimensions and apply responsive auto-fit
        setTimeout(() => {
          if (containerRef.current) {
            const section = containerRef.current.querySelector("section.docx") as HTMLElement;
            const measuredWidth = section?.offsetWidth || section?.clientWidth || 816;
            const measuredHeight = containerRef.current.offsetHeight || 1056;
            setDocWidth(measuredWidth);
            setDocHeight(measuredHeight);

            const fitZoom = calculateFitZoom(measuredWidth);
            setZoom(fitZoom);
            setIsAutoFit(true);
          }
        }, 60);
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
          setDocWidth(794);
          setDocHeight(1123);
          setTimeout(() => {
            const fitZoom = calculateFitZoom(794);
            setZoom(fitZoom);
            setIsAutoFit(true);
          }, 60);
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
  }, [documentId, calculateFitZoom]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  // ── Auto-adjust zoom on window resize / orientation change ────────────────
  useEffect(() => {
    const handleResize = () => {
      if (isAutoFit && docWidth) {
        const fitZoom = calculateFitZoom(docWidth);
        setZoom(fitZoom);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isAutoFit, docWidth, calculateFitZoom]);

  // ── Zoom handlers ──────────────────────────────────────────────────────────
  const handleZoomIn = () => {
    setIsAutoFit(false);
    setZoom((prev) => Math.min(prev + 15, 200));
  };

  const handleZoomOut = () => {
    setIsAutoFit(false);
    setZoom((prev) => Math.max(prev - 15, 25));
  };

  const handleToggleFit = () => {
    if (isAutoFit) {
      setIsAutoFit(false);
      setZoom(100);
    } else {
      setIsAutoFit(true);
      const fitZoom = calculateFitZoom(docWidth || 816);
      setZoom(fitZoom);
    }
  };

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
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* ── Viewer Toolbar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-border bg-card/90 backdrop-blur-sm gap-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground min-w-0">
          <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
          <span className="font-medium truncate max-w-[110px] xs:max-w-[150px] sm:max-w-[260px] md:max-w-[400px]">
            {fileName || "Loading..."}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Zoom Controls */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 25}
            className="h-7 w-7 p-0"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>

          {/* Toggle Fit / 100% */}
          <button
            onClick={handleToggleFit}
            className={`px-1.5 py-0.5 text-xs font-medium transition-colors rounded ${
              isAutoFit
                ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            title={isAutoFit ? "Click for 100% view" : "Click to fit screen width"}
          >
            {isAutoFit ? `Fit (${zoom}%)` : `${zoom}%`}
          </button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= 200}
            className="h-7 w-7 p-0"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>

          <div className="w-px h-4 bg-border mx-0.5 sm:mx-1" />

          {/* Download */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-7 px-2 gap-1 text-xs"
            title="Download original file"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </Button>

          {/* Reload */}
          <Button
            variant="ghost"
            size="sm"
            onClick={loadDocument}
            className="h-7 w-7 p-0"
            title="Reload preview"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* ── Document Preview Area ──────────────────────────────────────── */}
      <div 
        ref={viewerWrapperRef}
        className="flex-1 overflow-auto bg-muted/30 dark:bg-muted/10 p-2 sm:p-6"
      >
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
                    This document was created from a template and does not have a binary .docx file attached.
                  </p>
                </div>
                {onSwitchToEdit && (
                  <Button
                    onClick={onSwitchToEdit}
                    size="sm"
                    className="gap-1.5 bg-primary hover:bg-primary/90"
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
          <div className="flex justify-center min-w-full py-2 sm:py-4">
            <div
              style={{
                width: `${Math.round(794 * (zoom / 100))}px`,
                height: `${Math.round(1123 * (zoom / 100))}px`,
                transition: "width 0.2s ease, height 0.2s ease",
              }}
              className="relative flex justify-center origin-top cursor-zoom-in"
              onDoubleClick={handleToggleFit}
              title="Double-click to toggle Fit / 100%"
            >
              <div
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: "top center",
                  width: "794px",
                }}
                className="shrink-0"
              >
                <div className="a4-paper bg-white text-gray-900 shadow-xl rounded-sm p-10 sm:p-16 w-[794px] min-h-[1123px] border border-gray-200">
                  <div
                    className="prose max-w-none text-black font-sans leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DOCX preview container */}
        {!isNonDocx && !htmlContent && !loading && !error && (
          <div className="flex justify-center min-w-full py-2 sm:py-4">
            <div
              style={{
                width: docWidth ? `${Math.round(docWidth * (zoom / 100))}px` : undefined,
                height: docHeight ? `${Math.round(docHeight * (zoom / 100))}px` : undefined,
                transition: "width 0.2s ease, height 0.2s ease",
              }}
              className="relative flex justify-center origin-top cursor-zoom-in"
              onDoubleClick={handleToggleFit}
              title="Double-click to toggle Fit / 100%"
            >
              <div
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: "top center",
                  width: docWidth ? `${docWidth}px` : undefined,
                }}
                className="shrink-0"
              >
                <div
                  ref={containerRef}
                  className="docx-container bg-white shadow-xl"
                />
              </div>
            </div>
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
