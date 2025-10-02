import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_KEY
);

export async function createDocument(req: Request, res: Response) {
    try {
        const { title, type, content, owner_id } = req.body || {};
        if (!title || !type || !owner_id) {
            return res.status(400).json({ success: false, error: 'title, type, and owner_id are required' });
        }

        const { data, error } = await supabase
            .from('documents')
            .insert({ title, type, content: content ?? '', owner_id, version: '1.0.0', status: 'draft' })
            .select()
            .single();

        if (error) throw error;
        return res.status(201).json({ success: true, data });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return res.status(500).json({ success: false, error: message });
    }
}

export async function getDocument(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ success: false, error: 'Document not found' });
        return res.json({ success: true, data });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return res.status(500).json({ success: false, error: message });
    }
}

export async function updateDocument(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const updates = req.body || {};
        if (!updates || Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, error: 'No update fields provided' });
        }

        const { data, error } = await supabase
            .from('documents')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ success: false, error: 'Document not found' });
        return res.json({ success: true, data });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return res.status(500).json({ success: false, error: message });
    }
}

export async function deleteDocument(req: Request, res: Response) {
    try {
        const { id } = req.params;

        // Return deleted row to confirm existence
        const { data, error } = await supabase
            .from('documents')
            .delete()
            .eq('id', id)
            .select('id')
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ success: false, error: 'Document not found' });
        return res.json({ success: true, message: 'Document deleted' });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return res.status(500).json({ success: false, error: message });
    }
}

export async function getVersions(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('document_versions')
            .select('*')
            .eq('document_id', id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return res.json({ success: true, data });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return res.status(500).json({ success: false, error: message });
    }
}

export async function createVersion(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { content, changes_summary, changed_by, change_type } = req.body || {};
        if (!content || !changed_by) {
            return res.status(400).json({ success: false, error: 'content and changed_by are required' });
        }

        // Get current document
        const { data: doc, error: docError } = await supabase
            .from('documents')
            .select('version')
            .eq('id', id)
            .single();
        if (docError) throw docError;
        if (!doc) return res.status(404).json({ success: false, error: 'Document not found' });

        // Increment version safely
        const currentVersion = typeof doc.version === 'string' ? doc.version : '0.0.0';
        const [majorRaw, minorRaw, patchRaw] = currentVersion.split('.');
        const major = Number(majorRaw) || 0;
        const minor = Number(minorRaw) || 0;
        const patch = Number(patchRaw) || 0;

        const bump = (change_type as string) || 'patch';
        const newVersion = bump === 'major'
            ? `${major + 1}.0.0`
            : bump === 'minor'
                ? `${major}.${minor + 1}.0`
                : `${major}.${minor}.${patch + 1}`;

        // Create version record
        const { data, error } = await supabase
            .from('document_versions')
            .insert({
                document_id: id,
                version: newVersion,
                content,
                changes_summary,
                changed_by,
                change_type: bump
            })
            .select()
            .single();

        if (error) throw error;

        // Update document version
        await supabase
            .from('documents')
            .update({ version: newVersion })
            .eq('id', id);

        return res.status(201).json({ success: true, data });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return res.status(500).json({ success: false, error: message });
    }
}