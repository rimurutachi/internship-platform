'use client';

/**
 * Advisor Document Page Route
 *
 * Renders the Hybrid Dual-Mode Document Engine for a specific document.
 * Mode A: High-Fidelity Page Preview (default)
 * Mode B: Collaborative Text Editor (on-demand)
 */

import { useParams } from 'next/navigation';
import { DocumentDualModeContainer } from '@/components/shared/DocumentDualModeContainer';

export default function AdvisorDocumentPage() {
  const params = useParams();
  const documentId = params.documentId as string;

  return <DocumentDualModeContainer documentId={documentId} userType="advisor" />;
}
