import crypto from "crypto";
import * as forge from "node-forge";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

interface SignatureResult {
  signature: string;
  publicKey: string;
  certificateData: any;
}

class SignatureService {
  // Generate RSA key pair for a signer (typically done once per user)
  generateKeyPair(bits: number = 2048): { publicKey: string; privateKey: string } {
    console.log("🔑 [Signature] Generating RSA key pair", { bits });

    const rsa = forge.pki.rsa;
    const keypair = rsa.generateKeyPair(bits);

    const publicKey = forge.pki.publicKeyToPem(keypair.publicKey);
    const privateKey = forge.pki.privateKeyToPem(keypair.privateKey);

    return { publicKey, privateKey };
  }

  // Create a self-signed certificate for a signer
  createCertificate(params: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
  }): { certificate: string; publicKey: string; privateKey: string } {
    console.log("📜 [Signature] Creating self-signed certificate", {
      userId: params.userId.substring(0, 8),
      email: params.email,
    });

    const { publicKey, privateKey } = this.generateKeyPair(2048);

    const attrs = [
      { name: "commonName", value: `${params.firstName} ${params.lastName}` },
      { name: "organizationName", value: "Intern-Galing Platform" },
      { name: "countryName", value: "PH" },
    ];

    const publicKeyObj = forge.pki.publicKeyFromPem(publicKey);
    const privateKeyObj = forge.pki.privateKeyFromPem(privateKey);

    const cert = forge.pki.createCertificate();
    cert.publicKey = publicKeyObj;
    cert.serialNumber = "01";
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.setExtensions([
      { name: "basicConstraints", cA: false },
      {
        name: "keyUsage",
        keyCertSign: false,
        digitalSignature: true,
        nonRepudiation: true,
        dataEncipherment: false,
      },
      {
        name: "subjectAltName",
        altNames: [{ type: 2, value: params.email }],
      },
    ]);

    cert.sign(privateKeyObj, forge.md.sha256.create());

    const certificate = forge.pki.certificateToPem(cert);

    console.log("✅ [Signature] Certificate created", {
      subject: cert.subject.getField("commonName")?.value,
      notAfter: cert.validity.notAfter,
    });

    return { certificate, publicKey, privateKey };
  }

  // Sign document content
  signContent(params: {
    content: string | Buffer | object;
    privateKey: string;
  }): string {
    const { content, privateKey } = params;

    let data: string;
    if (Buffer.isBuffer(content)) {
      data = content.toString("utf-8");
    } else if (typeof content === "object") {
      data = JSON.stringify(content);
    } else {
      data = content;
    }

    console.log("✍️ [Signature] Signing content", { bytes: Buffer.byteLength(data) });

    const privateKeyObj = forge.pki.privateKeyFromPem(privateKey);
    const md = forge.md.sha256.create();
    md.update(data);

    const signature = privateKeyObj.sign(md);
    const signatureHex = forge.util.encode64(signature);

    console.log("✅ [Signature] Content signed");

    return signatureHex;
  }

  // Verify signature against original content
  verifySignature(params: {
    content: string | Buffer | object;
    signature: string;
    publicKey: string;
  }): boolean {
    const { content, signature, publicKey } = params;

    let data: string;
    if (Buffer.isBuffer(content)) {
      data = content.toString("utf-8");
    } else if (typeof content === "object") {
      data = JSON.stringify(content);
    } else {
      data = content;
    }

    try {
      console.log("🔍 [Signature] Verifying signature");

      const publicKeyObj = forge.pki.publicKeyFromPem(publicKey);
      const signatureBinary = forge.util.decode64(signature);
      const md = forge.md.sha256.create();
      md.update(data);

      const isValid = publicKeyObj.verify(md.digest().bytes(), signatureBinary);

      console.log(isValid ? "✅" : "❌", "[Signature] Signature verification", { isValid });

      return isValid;
    } catch (error) {
      console.error("❌ [Signature] Verification error", error);
      return false;
    }
  }

  // Store signature in database
  async storeSignature(params: {
    documentId: string;
    documentVersionId?: string;
    signerId: string;
    signatureData: string;
    certificateData: any;
    metadata?: any;
    // Phase A: Enhanced metadata
    ipAddress?: string;
    deviceFingerprint?: string;
    geolocation?: {
      country?: string;
      region?: string;
      city?: string;
      latitude?: number;
      longitude?: number;
    };
    physicalVerificationStatus?: 'pending' | 'verified' | 'rejected' | 'expired';
  }) {
    const { 
      documentId, 
      documentVersionId, 
      signerId, 
      signatureData, 
      certificateData, 
      metadata,
      ipAddress,
      deviceFingerprint,
      geolocation,
      physicalVerificationStatus,
    } = params;

    const signatureHash = crypto
      .createHash("sha256")
      .update(signatureData)
      .digest("hex");

    console.log("💾 [Signature] Storing signature", {
      documentId: documentId.substring(0, 8),
      signatureHash: signatureHash.substring(0, 16),
      physicalStatus: physicalVerificationStatus || 'pending',
    });

    const insertData: any = {
      document_id: documentId,
      document_version_id: documentVersionId || null,
      signer_id: signerId,
      signature_data: signatureData,
      certificate_data: certificateData,
      signature_hash: signatureHash,
      verification_status: 'valid', // Digital signature is valid
      metadata: metadata || {},
      signed_at: new Date().toISOString(),
    };

    // Phase A: Add enhanced metadata if provided
    if (ipAddress) insertData.ip_address = ipAddress;
    if (deviceFingerprint) insertData.device_fingerprint = deviceFingerprint;
    if (geolocation) insertData.geolocation = geolocation;
    if (physicalVerificationStatus) {
      insertData.physical_verification_status = physicalVerificationStatus;
      console.log(`⚠️ [Signature] Physical verification status: ${physicalVerificationStatus}`);
    }

    const { data, error } = await supabase
      .from("document_signatures")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("❌ [Signature] Storage error", error);
      throw error;
    }

    console.log("✅ [Signature] Stored", { signatureId: data.id.substring(0, 8) });

    return data;
  }

  // Get all signatures for a document
  async getDocumentSignatures(documentId: string) {
    const { data, error } = await supabase
      .from("document_signatures")
      .select("*, signer:users!signer_id(id, first_name, last_name, email)")
      .eq("document_id", documentId)
      .order("signed_at", { ascending: false });

    if (error) {
      console.error("❌ [Signature] Get signatures error", error);
      throw error;
    }

    return data || [];
  }

  // Revoke a signature
  async revokeSignature(signatureId: string) {
    console.log("❌ [Signature] Revoking signature", { signatureId: signatureId.substring(0, 8) });

    const { data, error } = await supabase
      .from("document_signatures")
      .update({ verification_status: "revoked" })
      .eq("id", signatureId)
      .select()
      .single();

    if (error) {
      console.error("❌ [Signature] Revoke error", error);
      throw error;
    }

    console.log("✅ [Signature] Signature revoked");

    return data;
  }
}

export const signatureService = new SignatureService();
export default signatureService;
