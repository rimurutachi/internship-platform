'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import axios from 'axios';
import {
  ShieldCheck,
  ShieldX,
  FileText,
  Clock,
  Hash,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Calendar,
  Tag,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AnimateIn } from '@/components/ui/AnimateIn';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VerificationDocument {
  id: string;
  title: string;
  type: string;
  status: 'pre_approved' | 'approved';
  version: string;
  created_at: string;
  updated_at: string;
}

interface VerificationInfo {
  content_hash: string;
  pre_approved_at: string;
  pre_approved_by: string;
}

interface VerificationResponse {
  success: boolean;
  data: {
    verified: boolean;
    document: VerificationDocument;
    verification: VerificationInfo;
    secure_pdf_url: string;
  };
}

type PageState = 'loading' | 'verified' | 'failed' | 'not_found' | 'error';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format an ISO date string into a human-readable locale string. */
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/** Pretty-print a document type slug. */
function formatDocumentType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Map status to badge variant. */
function statusBadgeVariant(status: string) {
  switch (status) {
    case 'approved':
      return 'success' as const;
    case 'pre_approved':
      return 'warning' as const;
    default:
      return 'secondary' as const;
  }
}

/** Pretty label for a status slug. */
function statusLabel(status: string): string {
  switch (status) {
    case 'approved':
      return 'Approved';
    case 'pre_approved':
      return 'Pre-Approved';
    default:
      return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

// ===========================================================================
// Sub-components
// ===========================================================================

/** Page header with CvSU logo and title. */
function VerificationHeader() {
  return (
    <header className="w-full text-center">
      <div className="flex flex-col items-center gap-3">
        {/* CvSU Logo */}
        <div className="relative h-16 w-16 sm:h-20 sm:w-20">
          <Image
            src="/cvsu-logo.png"
            alt="Cavite State University Logo"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Title */}
        <div>
          <h1 className="text-responsive-2xl sm:text-responsive-3xl font-bold tracking-tight text-foreground">
            Document Verification
          </h1>
          <p className="mt-1 text-responsive-sm text-muted-foreground">
            Intern-Galing Platform &middot; Cavite State University
          </p>
        </div>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------

/** Full-page loading state with spinner. */
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-responsive-base text-muted-foreground">
        Verifying document integrity&hellip;
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------

/** Error / not-found state. */
function ErrorState({ state }: { state: 'not_found' | 'error' }) {
  const isNotFound = state === 'not_found';

  return (
    <AnimateIn animation="scaleIn">
      <Card className="mx-auto max-w-lg border-destructive/30 bg-red-50/60 dark:bg-red-950/20">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          {isNotFound ? (
            <AlertTriangle className="h-16 w-16 text-amber-500" />
          ) : (
            <ShieldX className="h-16 w-16 text-destructive" />
          )}

          <h2 className="text-responsive-xl font-semibold text-foreground">
            {isNotFound ? 'Document Not Found' : 'Verification Error'}
          </h2>

          <p className="max-w-sm text-responsive-sm text-muted-foreground">
            {isNotFound
              ? 'The document ID in the URL does not match any record in our system. Please check the QR code and try again.'
              : 'We could not reach the verification server. Please check your internet connection and try again later.'}
          </p>
        </CardContent>
      </Card>
    </AnimateIn>
  );
}

// ---------------------------------------------------------------------------

/** Large verification result banner (verified / failed). */
function VerificationBanner({ verified }: { verified: boolean }) {
  return (
    <AnimateIn animation="scaleIn">
      <Card
        className={cn(
          'relative overflow-hidden border-2',
          verified
            ? 'border-green-500/40 bg-green-50/70 dark:border-green-500/30 dark:bg-green-950/30'
            : 'border-red-500/40 bg-red-50/70 dark:border-red-500/30 dark:bg-red-950/30',
        )}
      >
        {/* Decorative gradient bar */}
        <div
          className={cn(
            'absolute inset-x-0 top-0 h-1.5',
            verified
              ? 'bg-gradient-to-r from-green-500 via-emerald-400 to-green-600'
              : 'bg-gradient-to-r from-red-500 via-rose-400 to-red-600',
          )}
        />

        <CardContent className="flex flex-col items-center gap-3 pt-10 pb-8 text-center">
          {/* Icon with pulse ring */}
          <div className="relative">
            <div
              className={cn(
                'absolute inset-0 rounded-full opacity-20 animate-ping',
                verified ? 'bg-green-500' : 'bg-red-500',
              )}
              style={{ animationDuration: '2s', animationIterationCount: '3' }}
            />
            {verified ? (
              <ShieldCheck className="relative h-20 w-20 text-green-600 dark:text-green-400" />
            ) : (
              <ShieldX className="relative h-20 w-20 text-red-600 dark:text-red-400" />
            )}
          </div>

          <h2
            className={cn(
              'text-responsive-3xl font-bold tracking-tight',
              verified
                ? 'text-green-700 dark:text-green-300'
                : 'text-red-700 dark:text-red-300',
            )}
          >
            {verified ? 'Document Verified' : 'Verification Failed'}
          </h2>

          <p className="max-w-md text-responsive-sm text-muted-foreground">
            {verified
              ? 'This document has been cryptographically verified. Its contents have not been altered since it was pre-approved in the Intern-Galing system.'
              : 'This document could not be verified. It may have been tampered with or is no longer valid. Please contact your administrator.'}
          </p>
        </CardContent>
      </Card>
    </AnimateIn>
  );
}

// ---------------------------------------------------------------------------

/** Single detail row used inside the document details grid. */
function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className="mt-0.5 text-responsive-sm font-medium text-foreground break-words">
          {children}
        </div>
      </div>
    </div>
  );
}

/** Document metadata card. */
function DocumentDetails({
  document,
  verification,
}: {
  document: VerificationDocument;
  verification: VerificationInfo;
}) {
  return (
    <AnimateIn animation="fadeInUp" staggerIndex={2}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-responsive-lg font-semibold text-foreground">
              Document Details
            </h3>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <DetailRow icon={FileText} label="Document Title">
              {document.title}
            </DetailRow>

            <DetailRow icon={Tag} label="Document Type">
              {formatDocumentType(document.type)}
            </DetailRow>

            <DetailRow icon={Info} label="Status">
              <Badge variant={statusBadgeVariant(document.status)}>
                {statusLabel(document.status)}
              </Badge>
            </DetailRow>

            <DetailRow icon={Tag} label="Version">
              v{document.version}
            </DetailRow>

            <DetailRow icon={Calendar} label="Date Created">
              {formatDate(document.created_at)}
            </DetailRow>

            <DetailRow icon={Clock} label="Date Pre-Approved">
              {formatDate(verification.pre_approved_at)}
            </DetailRow>
          </div>
        </CardContent>
      </Card>
    </AnimateIn>
  );
}

// ---------------------------------------------------------------------------

/** Content integrity hash display. */
function IntegrityHash({
  hash,
  verified,
}: {
  hash: string;
  verified: boolean;
}) {
  return (
    <AnimateIn animation="fadeInUp" staggerIndex={3}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            <h3 className="text-responsive-lg font-semibold text-foreground">
              Content Integrity
            </h3>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-5">
          {/* Verification label */}
          <div className="mb-3 flex items-center gap-2">
            {verified ? (
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            )}
            <span
              className={cn(
                'text-responsive-sm font-semibold',
                verified
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300',
              )}
            >
              {verified ? 'Content Integrity: Verified' : 'Content Integrity: Failed'}
            </span>
          </div>

          {/* Hash box */}
          <div className="rounded-lg border bg-muted/50 p-3 sm:p-4">
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              SHA-256 Hash
            </p>
            <code className="block break-all font-mono text-xs leading-relaxed text-foreground/80 sm:text-sm">
              {hash}
            </code>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            This cryptographic hash uniquely represents the document&rsquo;s contents.
            Any modification to the document would produce a different hash value.
          </p>
        </CardContent>
      </Card>
    </AnimateIn>
  );
}

// ---------------------------------------------------------------------------

/** Secure PDF link card (only shown when URL is available). */
function SecurePdfLink({ url }: { url: string }) {
  return (
    <AnimateIn animation="fadeInUp" staggerIndex={4}>
      <Card className="border-primary/20 bg-accent/50">
        <CardContent className="flex flex-col items-center gap-3 py-5 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <FileText className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-responsive-sm font-semibold text-foreground">
                View Secure Document
              </p>
              <p className="text-xs text-muted-foreground">
                Access the signed PDF version of this document
              </p>
            </div>
          </div>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-5 py-2.5',
              'bg-primary text-primary-foreground font-medium text-sm',
              'transition-colors hover:bg-primary/90',
              'touch-target',
            )}
          >
            Open PDF
            <ExternalLink className="h-4 w-4" />
          </a>
        </CardContent>
      </Card>
    </AnimateIn>
  );
}

// ---------------------------------------------------------------------------

/** Page footer with branding. */
function VerificationFooter() {
  return (
    <footer className="mt-4 text-center">
      <Separator className="mb-4" />
      <div className="flex flex-col items-center gap-1">
        <p className="text-xs text-muted-foreground">
          Powered by{' '}
          <span className="font-semibold text-primary">Intern-Galing</span>{' '}
          Platform
        </p>
        <p className="text-[11px] text-muted-foreground/70">
          Cavite State University &middot; Document Verification System
        </p>
      </div>
    </footer>
  );
}

// ===========================================================================
// Main Page Component
// ===========================================================================

export default function DocumentVerificationPage() {
  const params = useParams<{ documentId: string }>();
  const documentId = params.documentId;

  const [state, setState] = useState<PageState>('loading');
  const [data, setData] = useState<VerificationResponse['data'] | null>(null);

  useEffect(() => {
    if (!documentId) {
      setState('not_found');
      return;
    }

    let cancelled = false;

    async function fetchVerification() {
      try {
        const response = await axios.get<VerificationResponse>(
          `${API_URL}/public/documents/verify/${documentId}`,
        );

        if (cancelled) return;

        if (response.data.success && response.data.data) {
          setData(response.data.data);
          setState(response.data.data.verified ? 'verified' : 'failed');
        } else {
          setState('not_found');
        }
      } catch (err: unknown) {
        if (cancelled) return;

        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setState('not_found');
        } else {
          setState('error');
        }
      }
    }

    fetchVerification();

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-background dark:to-background">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        {/* ---- Header ---- */}
        <VerificationHeader />

        {/* Decorative divider */}
        <div className="my-6 flex items-center gap-3">
          <Separator className="flex-1" />
          <div className="h-2 w-2 rounded-full bg-primary/40" />
          <Separator className="flex-1" />
        </div>

        {/* ---- Main Content ---- */}
        <main className="flex flex-col gap-5">
          {/* Loading */}
          {state === 'loading' && <LoadingState />}

          {/* Error states */}
          {(state === 'not_found' || state === 'error') && (
            <ErrorState state={state} />
          )}

          {/* Verification result */}
          {(state === 'verified' || state === 'failed') && data && (
            <>
              <VerificationBanner verified={data.verified} />
              <DocumentDetails
                document={data.document}
                verification={data.verification}
              />
              <IntegrityHash
                hash={data.verification.content_hash}
                verified={data.verified}
              />
              {data.secure_pdf_url && (
                <SecurePdfLink url={data.secure_pdf_url} />
              )}
            </>
          )}
        </main>

        {/* ---- Footer ---- */}
        <div className="mt-8">
          <VerificationFooter />
        </div>
      </div>
    </div>
  );
}
