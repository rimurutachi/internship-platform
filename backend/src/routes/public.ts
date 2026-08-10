import express from 'express';
import documentServiceProxy from '../services/documentServiceProxy';

const router = express.Router();

/**
 * Public Routes (No Authentication Required)
 * These endpoints are accessible to anyone for verification purposes
 */

/**
 * @route   GET /api/public/signatures/verify/:signatureId
 * @desc    Verify signature via QR code (public, no auth)
 * @access  Public
 */
router.get('/signatures/verify/:signatureId', async (req: any, res: any) => {
  try {
    console.log('🔍 [Backend Public] Signature verification request:', req.params.signatureId.substring(0, 8));
    
    const result = await documentServiceProxy.verifySignaturePublic(req.params.signatureId);
    
    res.json(result);
  } catch (error: any) {
    console.error('❌ [Backend Public] Signature verification failed:', error.message);
    res.status(error.response?.status || 500).json({ 
      success: false,
      error: error.message || 'Signature verification failed'
    });
  }
});

/**
 * @route   GET /api/public/documents/verify/:documentId
 * @desc    Verify pre-approved/approved document integrity via QR code (public)
 * @access  Public
 */
router.get('/documents/verify/:documentId', async (req: any, res: any) => {
  try {
    console.log('🔍 [Backend Public] Document verification request:', req.params.documentId.substring(0, 8));
    
    const result = await documentServiceProxy.verifyDocumentPublic(req.params.documentId);
    
    res.json(result);
  } catch (error: any) {
    console.error('❌ [Backend Public] Document verification failed:', error.message);
    res.status(error.response?.status || 500).json({ 
      success: false,
      error: error.message || 'Document verification failed',
      status: error.response?.data?.status
    });
  }
});

export default router;
