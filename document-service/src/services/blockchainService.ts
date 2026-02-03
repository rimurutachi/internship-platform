import crypto from "crypto";
import { MerkleTree } from "merkletreejs";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

interface BlockchainEntry {
  documentId: string;
  actionType: "created" | "updated" | "signed" | "approved";
  actionBy: string;
  contentHash: string;
}

class BlockchainService {
  private hashAlgorithm = env.BLOCKCHAIN_HASH_ALGORITHM || "sha256";

  // Compute SHA-256 hash of content
  hashContent(content: string | Buffer | object): string {
    let data: string;
    if (Buffer.isBuffer(content)) {
      data = content.toString("utf-8");
    } else if (typeof content === "object") {
      data = JSON.stringify(content);
    } else {
      data = content;
    }

    return crypto.createHash(this.hashAlgorithm).update(data).digest("hex");
  }

  // Get latest block for a document (to link previous_hash)
  async getLatestBlock(documentId: string) {
    const { data, error } = await supabase
      .from("document_blockchain")
      .select("*")
      .eq("document_id", documentId)
      .order("timestamp", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("❌ [Blockchain] Get latest block error", error);
      return null;
    }
    return data;
  }

  // Create a new blockchain entry for a document
  async recordBlock(params: {
    documentId: string;
    actionType: "created" | "updated" | "signed" | "approved";
    actionBy: string;
    content: string | Buffer | object;
    metadata?: any;
  }) {
    const { documentId, actionType, actionBy, content, metadata } = params;

    if (!env.BLOCKCHAIN_ENABLED) {
      console.log("⏸️ [Blockchain] Disabled via config");
      return null;
    }

    try {
      const contentHash = this.hashContent(content);
      const latestBlock = await this.getLatestBlock(documentId);
      const previousHash = latestBlock?.block_hash || null;

      // Generate unique block hash (content + timestamp + random nonce)
      const blockData = `${contentHash}${Date.now()}${Math.random()}`;
      const blockHash = this.hashContent(blockData);

      console.log("🔗 [Blockchain] Recording block", {
        documentId,
        actionType,
        contentHash: contentHash.substring(0, 16),
        blockHash: blockHash.substring(0, 16),
        previousHash: previousHash?.substring(0, 16),
      });

      const { data, error } = await supabase
        .from("document_blockchain")
        .insert({
          document_id: documentId,
          block_hash: blockHash,
          previous_hash: previousHash,
          content_hash: contentHash,
          action_type: actionType,
          action_by: actionBy,
          timestamp: new Date().toISOString(),
          metadata: metadata || {},
        })
        .select()
        .single();

      if (error) {
        console.error("❌ [Blockchain] Record block error", error);
        throw error;
      }

      console.log("✅ [Blockchain] Block recorded", { blockHash: blockHash.substring(0, 16) });
      return data;
    } catch (error) {
      console.error("❌ [Blockchain] Recording error", error);
      throw error;
    }
  }

  // Verify chain integrity (check previous_hash links)
  async verifyChainIntegrity(documentId: string): Promise<boolean> {
    try {
      const { data: blocks, error } = await supabase
        .from("document_blockchain")
        .select("*")
        .eq("document_id", documentId)
        .order("timestamp", { ascending: true });

      if (error) throw error;
      if (!blocks || blocks.length === 0) return true;

      for (let i = 1; i < blocks.length; i++) {
        const current = blocks[i];
        const previous = blocks[i - 1];

        if (current.previous_hash !== previous.block_hash) {
          console.warn("⚠️ [Blockchain] Chain integrity failed at block", i);
          return false;
        }
      }

      console.log("✅ [Blockchain] Chain integrity verified", {
        documentId,
        blocks: blocks.length,
      });
      return true;
    } catch (error) {
      console.error("❌ [Blockchain] Integrity check error", error);
      throw error;
    }
  }

  // Verify a specific block (compare content hash)
  async verifyBlock(blockId: string, originalContent: string | Buffer | object): Promise<boolean> {
    try {
      const { data: block, error } = await supabase
        .from("document_blockchain")
        .select("*")
        .eq("id", blockId)
        .single();

      if (error || !block) {
        console.error("❌ [Blockchain] Block not found", blockId);
        return false;
      }

      const computedHash = this.hashContent(originalContent);
      const isValid = computedHash === block.content_hash;

      console.log(isValid ? "✅" : "❌", "[Blockchain] Block verification", {
        blockId: blockId.substring(0, 16),
        valid: isValid,
      });

      return isValid;
    } catch (error) {
      console.error("❌ [Blockchain] Verification error", error);
      throw error;
    }
  }

  // Calculate Merkle root for a set of blocks (batch verification)
  async calculateMerkleRoot(documentId: string): Promise<string | null> {
    try {
      const { data: blocks, error } = await supabase
        .from("document_blockchain")
        .select("block_hash")
        .eq("document_id", documentId)
        .order("timestamp", { ascending: true });

      if (error) throw error;
      if (!blocks || blocks.length === 0) return null;

      const hashes = blocks.map((b) =>
        Buffer.from(b.block_hash, "hex")
      );

      const tree = new MerkleTree(hashes, crypto.createHash("sha256"), {
        hashLeaves: false,
        sort: false,
      });

      const merkleRoot = tree.getRoot().toString("hex");

      console.log("🌳 [Blockchain] Merkle root calculated", {
        documentId,
        blocks: blocks.length,
        root: merkleRoot.substring(0, 16),
      });

      // Store merkle root in latest block
      if (blocks.length > 0) {
        await supabase
          .from("document_blockchain")
          .update({ merkle_root: merkleRoot })
          .eq("document_id", documentId)
          .is("merkle_root", null);
      }

      return merkleRoot;
    } catch (error) {
      console.error("❌ [Blockchain] Merkle root error", error);
      throw error;
    }
  }

  // Get full ledger for a document
  async getLedger(documentId: string) {
    try {
      const { data: blocks, error } = await supabase
        .from("document_blockchain")
        .select("*, action_by_user:users!action_by(id, first_name, last_name, email)")
        .eq("document_id", documentId)
        .order("timestamp", { ascending: true });

      if (error) throw error;

      return blocks || [];
    } catch (error) {
      console.error("❌ [Blockchain] Get ledger error", error);
      throw error;
    }
  }
}

export const blockchainService = new BlockchainService();
export default blockchainService;
