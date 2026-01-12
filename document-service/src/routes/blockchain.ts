import { Router } from "express";
import * as blockchainController from "../controllers/blockchainController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.use(authenticateToken);

// Record blockchain entry for a document
router.post("/:documentId/blockchain/record", blockchainController.recordBlockchainEntry);

// Get full ledger/history for a document
router.get("/:documentId/blockchain/ledger", blockchainController.getDocumentLedger);

// Verify chain integrity (all blocks linked correctly)
router.post("/:documentId/blockchain/verify", blockchainController.verifyDocumentIntegrity);

// Verify specific block against original content
router.post("/:blockId/blockchain/verify-block", blockchainController.verifyBlock);

// Calculate/recalculate Merkle root for batch verification
router.post("/:documentId/blockchain/merkle", blockchainController.calculateMerkleRoot);

export default router;
