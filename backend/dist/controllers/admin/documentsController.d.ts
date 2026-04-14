import { Request, Response } from 'express';
/**
 * Get all documents with filters, sorting, and pagination (bypasses RLS)
 */
export declare const getAllDocuments: (req: Request, res: Response) => Promise<void>;
/**
 * Get single document with full details (versions, comments, workflow, collaborators)
 */
export declare const getDocument: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get document version history with semantic version sorting
 */
export declare const getVersions: (req: Request, res: Response) => Promise<void>;
/**
 * Get document comments with threading
 */
export declare const getComments: (req: Request, res: Response) => Promise<void>;
/**
 * Get document workflow and approvals
 */
export declare const getWorkflow: (req: Request, res: Response) => Promise<void>;
/**
 * Update document status with validation
 */
export declare const updateStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Update workflow (approve/reject/advance)
 */
export declare const updateWorkflow: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Archive a document
 */
export declare const archiveDocument: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Delete a document
 */
export declare const deleteDocument: (req: Request, res: Response) => Promise<void>;
/**
 * Get document statistics
 */
export declare const getDocumentStats: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=documentsController.d.ts.map