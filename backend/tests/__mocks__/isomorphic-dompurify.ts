/**
 * Mock for isomorphic-dompurify to avoid ESM dependency chain issues in Jest.
 * The real module pulls in jsdom → html-encoding-sniffer → @exodus/bytes
 * which uses ESM `export` syntax that Jest/ts-jest can't parse by default.
 */
const DOMPurify = {
  sanitize: (input: string, _config?: any) => {
    // In tests, just return the input as-is (no actual sanitization needed)
    return typeof input === "string" ? input : "";
  },
  isSupported: true,
};

export default DOMPurify;
