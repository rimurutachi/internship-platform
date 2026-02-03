"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const env_1 = require("../config/env");
const supabase = (0, supabase_js_1.createClient)(env_1.env.SUPABASE_URL, env_1.env.SUPABASE_SERVICE_KEY);
class VersionService {
    // Get all versions for a document
    async getVersionHistory(documentId) {
        const { data, error } = await supabase
            .from("document_versions")
            .select("*, changed_by_user:users!changed_by(id, first_name, last_name)")
            .eq("document_id", documentId)
            .order("created_at", { ascending: false });
        if (error)
            throw error;
        return data;
    }
    // Get specific versions
    async getVersion(versionId) {
        const { data, error } = await supabase
            .from("document_versions")
            .select("*")
            .eq("id", versionId)
            .single();
        if (error)
            throw error;
        return data;
    }
    // Restore document to a previous version
    async restoreVersion(documentId, versionId, userId) {
        // Get version document
        const version = await this.getVersion(versionId);
        if (!version)
            throw new Error("Version not found.");
        // Update document to this version's content
        const { data, error } = await supabase
            .from("documents")
            .update({ content: version.content, update_at: new Date().toISOString() })
            .eq("id", documentId)
            .select()
            .single();
        if (error)
            throw error;
        // Create new version entry for restore action
        await supabase.from("document_versions").insert({
            document_id: documentId,
            version: data.version,
            content: version.content,
            changes_summary: `Restored to version ${version.version}`,
            changed_by: userId,
            change_type: "restore",
        });
        return data;
    }
    // Compare two versions
    async compareVersions(versionId1, versionId2) {
        const [v1, v2] = await Promise.all([
            this.getVersion(versionId1),
            this.getVersion(versionId2),
        ]);
        if (!v1 || !v2)
            throw new Error("Version not found.");
        return {
            version1: v1,
            version2: v2,
        };
    }
}
exports.VersionService = VersionService;
