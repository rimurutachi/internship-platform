import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import axios from 'axios';

// ────────────────────────────────────────────────────────────────
// Red-text hex colours that are treated as "editable placeholder".
// All comparisons are done in uppercase.
// ────────────────────────────────────────────────────────────────
const RED_COLOR_HEX = new Set([
  'FF0000',  // Pure red
  'C00000',  // Dark red
  'ED7D31',  // Orange-red (sometimes used in CvSU templates)
  'FF3333',  // Lighter red variant
  'CC0000',  // Alternate dark red
  'E00000',  // Another red shade
]);

/**
 * Checks whether a w:color hex value should be treated as "red placeholder".
 */
function isRedColor(hex: string): boolean {
  if (RED_COLOR_HEX.has(hex.toUpperCase())) return true;
  
  // Fallback heuristic for "red-ish" colors (High Red, low Green and Blue)
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    // If it's predominantly red
    if (r > 150 && g < 100 && b < 100) return true;
  }
  
  return false;
}

/**
 * Converts raw placeholder text (e.g. "(Company Address)", "First Name MI. Surname")
 * into a clean, bracket-compatible tag name like "Company_Address" or "First_Name_MI_Surname".
 *
 * Rules:
 *  1. Strip leading/trailing brackets, parentheses, angle-brackets, curly-braces.
 *  2. Trim whitespace.
 *  3. Replace any non-alphanumeric character with "_".
 *  4. Collapse consecutive underscores.
 *  5. Trim leading/trailing underscores.
 */
function sanitizeFieldName(text: string): string {
  return text
    .replace(/^[\(\)\[\]{}<>]+|[\(\)\[\]{}<>]+$/g, '') // 1
    .trim()                                             // 2
    .replace(/[^a-zA-Z0-9]/g, '_')                     // 3
    .replace(/_+/g, '_')                                // 4
    .replace(/^_|_$/g, '');                             // 5
}

/**
 * Detects whether a piece of red text is a numbered list entry.
 * e.g. "1. Abatas, Reginald V." → matches with index 1
 * Returns the number if it is, or null otherwise.
 */
function detectNumberedEntry(text: string): number | null {
  const match = text.trim().match(/^(\d+)\.\s+/);
  return match ? parseInt(match[1], 10) : null;
}

// ──────────────────────────────────────────────────────────────────────
// Token types used during paragraph-level XML tokenisation
// ──────────────────────────────────────────────────────────────────────
interface RunToken {
  type: 'run';
  isRed: boolean;
  hasBr: boolean;   // true if this run contains a <w:br/> line break
  text: string;
  rStart: string;   // opening <w:r ...>
  rContent: string;  // everything between <w:r> and </w:r>
  rEnd: string;      // closing </w:r>
}

interface WhitespaceToken {
  type: 'whitespace';
  content: string;
}

interface TextToken {
  type: 'text';
  content: string;
}

type ParagraphToken = RunToken | WhitespaceToken | TextToken;

/**
 * preprocessRedTextFields
 *
 * Scans `word/document.xml` inside a PizZip archive for text runs
 * (<w:r>) whose <w:rPr> contains a <w:color> matching any of the
 * known red hex values.
 *
 * Contiguous red runs within the same paragraph are merged into a
 * single `[FIELD_NAME]` tag so that Docxtemplater can process them.
 * Line breaks (<w:br/>) act as hard boundaries — red text on separate
 * lines within the same paragraph will produce separate fields.
 *
 * Numbered list entries (e.g. "1. Name Here") are detected and converted
 * into indexed fields like [Student_1], [Student_2], etc.
 *
 * The red <w:color> tag is removed from the run properties so the
 * generated output appears in the default (black) colour while
 * preserving every other formatting attribute (bold, underline, etc.).
 *
 * The zip is modified **in-place**.
 */
function preprocessRedTextFields(zip: PizZip): void {
  const xmlFile = zip.file('word/document.xml');
  if (!xmlFile) {
    console.warn('⚠️ [Preprocessor] word/document.xml not found in .docx archive');
    return;
  }

  let xml = xmlFile.asText();
  let fieldsFound = 0;

  // Process each paragraph independently
  xml = xml.replace(/<w:p[ >][\s\S]*?<\/w:p>/g, (pMatch) => {
    // ── Step 1: Tokenise the paragraph into runs and non-run text ──
    const tokens: ParagraphToken[] = [];
    const runRegex = /(<w:r[ >])([\s\S]*?)(<\/w:r>)/g;
    let lastIndex = 0;
    let m: RegExpExecArray | null;

    while ((m = runRegex.exec(pMatch)) !== null) {
      // Capture any non-run content between the previous match and this one
      if (m.index > lastIndex) {
        tokens.push({ type: 'text', content: pMatch.slice(lastIndex, m.index) });
      }

      const rStart = m[1];
      const rContent = m[2];
      const rEnd = m[3];

      // Check for red colour
      const colorMatch = rContent.match(/<w:color\s+w:val="([^"]+)"\s*\/?>/);
      const red = colorMatch ? isRedColor(colorMatch[1]) : false;

      // Check for line break inside this run
      const hasBr = /<w:br[\s/>]/i.test(rContent);

      // Extract the visible text from <w:t>
      const tMatch = rContent.match(/<w:t(?:\s+[^>]*)?>([^<]*)<\/w:t>/);
      const text = tMatch ? tMatch[1] : '';

      tokens.push({ type: 'run', isRed: red, hasBr, text, rStart, rContent, rEnd });
      lastIndex = runRegex.lastIndex;
    }

    // Trailing content after the last run
    if (lastIndex < pMatch.length) {
      tokens.push({ type: 'text', content: pMatch.slice(lastIndex) });
    }

    // ── Step 2: Group contiguous red runs and convert to [TAG] ──
    let result = '';
    let redBuffer: ParagraphToken[] = [];

    function flushRedBuffer(): void {
      if (redBuffer.length === 0) return;

      // Concatenate text from red runs only (skip whitespace/text tokens)
      const fullText = redBuffer
        .map((t) => (t.type === 'run' ? t.text : ''))
        .join('');

      // Check if this is a numbered list entry (e.g. "1. Abatas, Reginald V.")
      const entryNumber = detectNumberedEntry(fullText);

      let fieldName: string;
      if (entryNumber !== null) {
        // Numbered entry → create an indexed field like [Student_1]
        fieldName = `Student_${entryNumber}`;
      } else {
        fieldName = sanitizeFieldName(fullText);
      }

      if (fieldName) {
        fieldsFound++;
        // Use the first actual run's formatting (minus the colour)
        const firstRun = redBuffer.find((t): t is RunToken => t.type === 'run');
        if (firstRun) {
          // Remove the red <w:color> but keep everything else (underline, bold, etc.)
          const cleanedContent = firstRun.rContent
            .replace(/<w:color\s+w:val="[^"]+"\s*\/?>/g, '')
            .replace(/<w:t(?:\s+[^>]*)?>([^<]*)<\/w:t>/, `<w:t>[${fieldName}]</w:t>`);

          result += `${firstRun.rStart}${cleanedContent}${firstRun.rEnd}`;
        }
      } else {
        // Nothing meaningful — keep original content as-is
        for (const t of redBuffer) {
          if (t.type === 'run') {
            result += `${t.rStart}${t.rContent}${t.rEnd}`;
          } else {
            result += t.content;
          }
        }
      }

      redBuffer = [];
    }

    for (const token of tokens) {
      // ── Line breaks (<w:br/>) are HARD BOUNDARIES ──
      // A run containing <w:br/> always flushes the red buffer first,
      // then is emitted as-is. This prevents "Company Name" and
      // "Company Address" (separated by a line break) from merging.
      if (token.type === 'run' && (token as RunToken).hasBr) {
        flushRedBuffer();
        result += `${token.rStart}${token.rContent}${token.rEnd}`;
      } else if (token.type === 'run' && token.isRed && token.text.trim().length > 0) {
        // Red run with visible text → buffer it
        redBuffer.push(token);
      } else if (token.type === 'run' && token.isRed && token.text.trim().length === 0) {
        // Red run that is just whitespace (e.g. a space between two red words)
        if (redBuffer.length > 0) {
          redBuffer.push(token);
        } else {
          result += `${token.rStart}${token.rContent}${token.rEnd}`;
        }
      } else if (token.type === 'text' && token.content.trim() === '' && redBuffer.length > 0) {
        // Pure XML whitespace between two red runs — keep buffering
        redBuffer.push({ type: 'whitespace', content: token.content });
      } else {
        // Non-red content → flush any pending red buffer first
        flushRedBuffer();
        if (token.type === 'run') {
          result += `${token.rStart}${token.rContent}${token.rEnd}`;
        } else {
          result += token.content;
        }
      }
    }

    // Flush anything remaining at the end of the paragraph
    flushRedBuffer();

    return result;
  });

  console.log(`🔴 [Preprocessor] Converted ${fieldsFound} red-text placeholder(s) into [TAG] fields`);

  // Write the modified XML back into the zip
  zip.file('word/document.xml', xml);
}

/**
 * docxGenerator
 *
 * Takes a master .docx file URL, downloads it, replaces template tags
 * (e.g. [student_name]) with the provided field values, and returns
 * a new .docx file Buffer that maintains 100% of the original formatting.
 *
 * Red-coloured text is automatically detected and converted into
 * editable [TAG] placeholders before rendering so that advisors
 * do not need to manually wrap every placeholder in brackets.
 */
export const docxGenerator = {
  /**
   * Generates a personalised .docx Buffer
   *
   * @param fileUrl The signed download URL of the master .docx file
   * @param fieldValues Key-value pairs of the fields to replace
   * @returns Buffer containing the generated .docx file
   */
  async generateFromUrl(fileUrl: string, fieldValues: Record<string, string>): Promise<Buffer> {
    try {
      console.log('🔄 [DocxGenerator] Downloading master template from URL...');

      // 1. Download the master .docx file as an ArrayBuffer
      const response = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
      });

      const content = response.data;
      console.log('✅ [DocxGenerator] Download complete, size:', content.byteLength);

      // 2. Load the zip file using PizZip
      const zip = new PizZip(content);

      // 3. Preprocess: convert red-coloured text → [TAG] placeholders
      preprocessRedTextFields(zip);

      // 4. Initialise Docxtemplater with square-bracket delimiters
      const doc = new Docxtemplater(zip, {
        delimiters: { start: '[', end: ']' },
        paragraphLoop: true,
        linebreaks: true,
        // Leave unmatched tags empty instead of throwing errors
        nullGetter(part: any) {
          if (!part.module) {
            return '';
          }
          if (part.module === 'rawxml') {
            return '';
          }
          return '';
        },
      });

      console.log('🔄 [DocxGenerator] Rendering template with values:', Object.keys(fieldValues));

      // 5. Inject the field values
      doc.render(fieldValues);

      // 6. Generate the output document
      const buf = doc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
      });

      console.log('✅ [DocxGenerator] Generation complete, output size:', buf.length);
      return buf as Buffer;
    } catch (error) {
      console.error('❌ [DocxGenerator] Error generating document:', error);
      throw error;
    }
  },

  /**
   * Extracts fields from a master .docx file URL
   *
   * Automatically detects:
   *  - Standard [BRACKET] tags
   *  - Red-coloured text placeholders (converted to [TAG] during preprocessing)
   *  - Numbered list entries (converted to [Student_1], [Student_2], etc.)
   *
   * @param fileUrl The signed download URL of the master .docx file
   * @returns Array of field objects extracted from the document
   */
  async extractFieldsFromUrl(fileUrl: string): Promise<{ name: string; label: string; required: boolean }[]> {
    try {
      console.log('🔄 [DocxGenerator] Extracting fields from master template...');

      const response = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
      });

      const content = response.data;
      const zip = new PizZip(content);

      // Preprocess: convert red-coloured text → [TAG] placeholders
      preprocessRedTextFields(zip);

      const doc = new Docxtemplater(zip, {
        delimiters: { start: '[', end: ']' },
        paragraphLoop: true,
        linebreaks: true,
      });

      // Get full text to manually parse brackets
      const text = doc.getFullText();

      // Look for [TAG_NAME] patterns
      const matches = text.match(/\[(.*?)\]/g);
      const uniqueTags = new Set<string>();

      if (matches) {
        matches.forEach((match) => {
          // Remove brackets
          const tag = match.slice(1, -1).trim();
          // Filter: must be at least 1 char and under 80 chars
          // Numeric tags ARE allowed (e.g. "448" for internship hours)
          if (tag.length >= 1 && tag.length < 80) {
            uniqueTags.add(tag);
          }
        });
      }

      console.log('✅ [DocxGenerator] Extraction complete, found fields:', uniqueTags.size);

      return Array.from(uniqueTags).map((tag) => {
        // For numbered student fields, mark as not required (can be left blank/N/A)
        const isNumberedField = /^Student_\d+$/.test(tag);
        return {
          name: tag,
          label: tag.replace(/_/g, ' '), // Convert underscores back to spaces for a human-readable label
          required: !isNumberedField,     // Numbered fields are optional (blank/N/A allowed)
        };
      });
    } catch (error) {
      console.error('❌ [DocxGenerator] Error extracting fields:', error);
      throw error;
    }
  },
};
