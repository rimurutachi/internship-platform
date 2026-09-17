/// <reference types="jest" />
import { narrativeReportDocxGenerator, normalizeDegreeProgram } from '../../src/utils/narrativeReportDocxGenerator';
import JSZip from 'jszip';

describe('narrativeReportDocxGenerator', () => {
  describe('normalizeDegreeProgram', () => {
    it('should expand BSIT acronym to full degree name', () => {
      expect(normalizeDegreeProgram('BSIT')).toBe('Bachelor of Science in Information Technology');
      expect(normalizeDegreeProgram('BS IT')).toBe('Bachelor of Science in Information Technology');
      expect(normalizeDegreeProgram('Information Technology')).toBe('Bachelor of Science in Information Technology');
    });

    it('should expand BSCS acronym to full degree name', () => {
      expect(normalizeDegreeProgram('BSCS')).toBe('Bachelor of Science in Computer Science');
      expect(normalizeDegreeProgram('BS CS')).toBe('Bachelor of Science in Computer Science');
    });

    it('should expand BSIS acronym to full degree name', () => {
      expect(normalizeDegreeProgram('BSIS')).toBe('Bachelor of Science in Information Systems');
    });

    it('should preserve already full degree names', () => {
      const full = 'Bachelor of Science in Computer Science';
      expect(normalizeDegreeProgram(full)).toBe(full);
    });

    it('should fallback to default degree if empty', () => {
      expect(normalizeDegreeProgram(undefined)).toBe('Bachelor of Science in Computer Science');
      expect(normalizeDegreeProgram('')).toBe('Bachelor of Science in Computer Science');
    });
  });

  describe('generate()', () => {
    it('should generate a valid DOCX buffer containing Title Page elements and proper margins', async () => {
      const buffer = await narrativeReportDocxGenerator.generate({
        studentName: 'MARKUS TAN',
        degreeProgram: 'BSIT',
        department: 'Department of Computer Studies',
        institution: 'Cavite State University',
        campus: 'Bacoor City Campus',
        campusAddress: 'Bacoor, Cavite',
        companyName: 'DATAMIND ANALYTICS',
        reportMonthYear: 'July 2026',
      });

      expect(buffer).toBeDefined();
      expect(buffer.length).toBeGreaterThan(5000);

      // Load zip to inspect XML
      const zip = await JSZip.loadAsync(buffer);
      const documentXml = await zip.file('word/document.xml')?.async('string');

      expect(documentXml).toBeDefined();
      expect(documentXml).toContain('ON-THE-JOB TRAINING EXPERIENCE AT DATAMIND ANALYTICS');
      expect(documentXml).toContain('A Narrative Report');
      expect(documentXml).toContain('Bachelor of Science in Information Technology');
      expect(documentXml).toContain('MARKUS TAN');
      expect(documentXml).toContain('July 2026');

      // Check margins (1.5" left = 2160 twips, 1.0" others = 1440 twips)
      expect(documentXml).toContain('w:left="2160"');
      expect(documentXml).toContain('w:right="1440"');
      expect(documentXml).toContain('w:top="1440"');
      expect(documentXml).toContain('w:bottom="1440"');
    });

    it('should generate properly with long company names and computer science degree', async () => {
      const buffer = await narrativeReportDocxGenerator.generate({
        studentName: 'JIMMAR D. IDIOMA',
        degreeProgram: 'Bachelor of Science in Computer Science',
        department: 'Department of Computer Studies',
        institution: 'Cavite State University',
        campus: 'Bacoor City Campus',
        campusAddress: 'Bacoor, Cavite',
        companyName: 'SP MADRID & ASSOCIATES',
        reportMonthYear: 'September 2025',
      });

      expect(buffer).toBeDefined();
      const zip = await JSZip.loadAsync(buffer);
      const documentXml = await zip.file('word/document.xml')?.async('string');

      expect(documentXml).toContain('SP MADRID &amp; ASSOCIATES');
      expect(documentXml).toContain('JIMMAR D. IDIOMA');
      expect(documentXml).toContain('September 2025');
      expect(documentXml).toContain('APPROVAL SHEET');
      expect(documentXml).toContain('ACKNOWLEDGEMENT');
      expect(documentXml).toContain('TABLE OF CONTENTS');
    });

    it('should generate properly formatted List of Figures, List of Appendix Figures, and List of Appendices', async () => {
      const buffer = await narrativeReportDocxGenerator.generate({
        studentName: 'JIMMAR D. IDIOMA',
        degreeProgram: 'BSCS',
        department: 'Department of Computer Studies',
        institution: 'Cavite State University',
        campus: 'Bacoor City Campus',
        campusAddress: 'Bacoor, Cavite',
        companyName: 'SP MADRID & ASSOCIATES',
        reportMonthYear: 'September 2025',
      });

      const zip = await JSZip.loadAsync(buffer);
      const documentXml = await zip.file('word/document.xml')?.async('string');

      expect(documentXml).toContain('LIST OF FIGURES');
      expect(documentXml).toContain('LIST OF APPENDIX FIGURES');
      expect(documentXml).toContain('LIST OF APPENDICES');

      // Check standard items exist
      expect(documentXml).toContain('Location map of the Establishment');
      expect(documentXml).toContain('Approved Endorsement Letter');
      expect(documentXml).toContain('Photo Documentation');

      // Check two-line header structure for List of Appendix Figures
      expect(documentXml).toContain('Appendix');
      expect(documentXml).toContain('Figure');
      expect(documentXml).toContain('Page');
    });

    it('should format Introduction preface with top/bottom borders, 1.16 multiple spacing, and 3-space gaps', async () => {
      const buffer = await narrativeReportDocxGenerator.generate({
        studentName: 'JIMMAR D. IDIOMA',
        degreeProgram: 'BSCS',
        department: 'Department of Computer Studies',
        institution: 'Cavite State University',
        campus: 'Bacoor City Campus',
        campusAddress: 'Bacoor, Cavite',
        companyName: 'SP MADRID & ASSOCIATES',
        reportMonthYear: 'September 2025',
      });

      const zip = await JSZip.loadAsync(buffer);
      const documentXml = await zip.file('word/document.xml')?.async('string');

      expect(documentXml).toContain('ON-THE-JOB TRAINING EXPERIENCES AT SP MADRID &amp; ASSOCIATES');
      expect(documentXml).toContain('A narrative report submitted to the faculty');
      expect(documentXml).toContain('INTRODUCTION');

      // Verify borders on preface paragraph
      expect(documentXml).toContain('w:pBdr');
      expect(documentXml).toContain('w:top');
      expect(documentXml).toContain('w:bottom');

      // Verify line spacing 1.16 (278 twips) and after 8pt (160 twips)
      expect(documentXml).toContain('w:line="278"');
      expect(documentXml).toContain('w:after="160"');
    });

    it('should format Appendices divider page with centered A P P E N D I C E S', async () => {
      const buffer = await narrativeReportDocxGenerator.generate({
        studentName: 'JIMMAR D. IDIOMA',
        degreeProgram: 'BSCS',
        department: 'Department of Computer Studies',
        institution: 'Cavite State University',
        campus: 'Bacoor City Campus',
        campusAddress: 'Bacoor, Cavite',
        companyName: 'SP MADRID & ASSOCIATES',
        reportMonthYear: 'September 2025',
      });

      const zip = await JSZip.loadAsync(buffer);
      const documentXml = await zip.file('word/document.xml')?.async('string');

      expect(documentXml).toContain('A P P E N D I C E S');
    });

    it('should format Appendix 12 with DAILY JOURNAL heading, AI weekly reflection, and continuous daily narrative paragraphs without tables', async () => {
      const buffer = await narrativeReportDocxGenerator.generate({
        studentName: 'JIMMAR D. IDIOMA',
        degreeProgram: 'BSCS',
        department: 'Department of Computer Studies',
        institution: 'Cavite State University',
        campus: 'Bacoor City Campus',
        campusAddress: 'Bacoor, Cavite',
        companyName: 'DATAMIND ANALYTICS',
        reportMonthYear: 'July 2026',
        weeklyJournals: [
          {
            weekNumber: 1,
            dateRange: 'April 10, 2026 – April 17, 2026',
            totalHours: 40,
            weeklySummary: 'During the first week at DataMind Analytics, I underwent onboarding and workstation setup.',
            dailyEntries: [
              {
                date: 'April 10, 2026',
                dayNumber: 1,
                dayOfWeek: 'Friday',
                hoursWorked: 8,
                activities: 'Attended company orientation and set up PostgreSQL environment.',
                learnings: 'Learned about data confidentiality and security policies.',
              },
              {
                date: 'April 13, 2026',
                dayNumber: 2,
                dayOfWeek: 'Monday',
                hoursWorked: 8,
                activities: 'Joined sprint planning and studied database schema dictionary.',
                learnings: 'Understood business meaning behind customer status codes.',
              },
            ],
          },
        ],
      });

      const zip = await JSZip.loadAsync(buffer);
      const documentXml = await zip.file('word/document.xml')?.async('string');

      expect(documentXml).toContain('Appendix 12. Daily Reflective Journal');
      expect(documentXml).toContain('DAILY JOURNAL');
      expect(documentXml).toContain('WEEK 1: APRIL 10, 2026 – APRIL 17, 2026');
      expect(documentXml).not.toContain('Hours Rendered');
      expect(documentXml).toContain('Weekly Reflective Summary:');
      expect(documentXml).not.toContain('AI-Assisted Synthesis');
      expect(documentXml).toContain('During the first week at DataMind Analytics, I underwent onboarding and workstation setup.');
      expect(documentXml).toContain('Day 1: April 10, 2026');
      expect(documentXml).toContain('Attended company orientation and set up PostgreSQL environment. Learned about data confidentiality and security policies.');
      expect(documentXml).toContain('Day 2: April 13, 2026');
      expect(documentXml).toContain('Joined sprint planning and studied database schema dictionary. Understood business meaning behind customer status codes.');
      
      // Ensure NO grid tables were generated for daily logs
      expect(documentXml).not.toContain('Day / Date');
      expect(documentXml).not.toContain('Activities Performed');
      expect(documentXml).not.toContain('Key Learnings &amp; Notes');

      // Verify double spacing (line="480") and after 8pt (after="160")
      expect(documentXml).toContain('w:line="480"');
      expect(documentXml).toContain('w:after="160"');
    });
  });
});
