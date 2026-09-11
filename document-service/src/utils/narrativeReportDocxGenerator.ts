import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  PageNumber,
  NumberFormat,
  Header,
  SectionType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  TabStopType,
  LeaderType,
  PageBreak,
} from 'docx';

export interface NarrativeReportData {
  studentName: string;
  degreeProgram: string;
  department: string;
  institution: string;
  campus: string;
  campusAddress: string;
  companyName: string;
  companyAddress?: string;
  adviserName?: string;
  supervisorName?: string;
  startDate?: string;
  endDate?: string;
  reportMonthYear: string;
}

// ── Typography & Spacing Constants (CvSU Standard) ──────────────────────────
const FONT_FAMILY = 'Arial';
const FONT_SIZE = 22; // 11pt (22 half-points)
const TITLE_SIZE = 22; // 11pt bold for headings

// A4 Dimensions: 210mm x 297mm in twips (1 inch = 1440 twips)
const PAGE_WIDTH = 11906;
const PAGE_HEIGHT = 16838;

// Margins: Left 1.5 inches (2160 twips), Top/Bottom/Right 1.0 inch (1440 twips)
const MARGIN_LEFT = 2160;
const MARGIN_RIGHT = 1440;
const MARGIN_TOP = 1440;
const MARGIN_BOTTOM = 1440;

// Right tab stop for dot leaders in Table of Contents (approx at right margin)
const TOC_TAB_POSITION = 8300;

// Spacing rules:
// - Double spacing: line: 480, before: 0, after: 0
// - 3 single line spaces after major titles: 3 * 240 = 720 twips after
const DOUBLE_SPACE = { line: 480, before: 0, after: 0 };
const SINGLE_SPACE = { line: 240, before: 0, after: 0 };

/**
 * Creates a standard centered bold major title paragraph with 3 single line spaces below.
 */
function createMajorHeading(title: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: 240, before: 0, after: 720 }, // 720 twips = 3 single lines
    children: [
      new TextRun({
        text: title.toUpperCase(),
        bold: true,
        font: FONT_FAMILY,
        size: TITLE_SIZE,
      }),
    ],
  });
}

/**
 * Creates a standard bold left-aligned subsection heading.
 */
function createSubHeading(title: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 480, before: 240, after: 120 },
    children: [
      new TextRun({
        text: title,
        bold: true,
        font: FONT_FAMILY,
        size: FONT_SIZE,
      }),
    ],
  });
}

/**
 * Creates a standard double-spaced body paragraph.
 */
function createBodyParagraph(text: string, indent: boolean = true): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.BOTH,
    indent: indent ? { firstLine: 720 } : undefined, // 0.5 inch first-line indent
    spacing: DOUBLE_SPACE,
    children: [
      new TextRun({
        text,
        font: FONT_FAMILY,
        size: FONT_SIZE,
      }),
    ],
  });
}

/**
 * Creates an empty line paragraph for spacing.
 */
function createEmptyLine(): Paragraph {
  return new Paragraph({
    spacing: SINGLE_SPACE,
    children: [new TextRun({ text: '', font: FONT_FAMILY, size: FONT_SIZE })],
  });
}

/**
 * Creates a Table of Contents entry with dot leaders.
 */
function createTocEntry(title: string, isBold: boolean = false, isSubItem: boolean = false): Paragraph {
  return new Paragraph({
    spacing: DOUBLE_SPACE,
    indent: isSubItem ? { left: 400 } : undefined,
    tabStops: [
      {
        type: TabStopType.RIGHT,
        position: TOC_TAB_POSITION,
        leader: LeaderType.DOT,
      },
    ],
    children: [
      new TextRun({
        text: title,
        bold: isBold,
        font: FONT_FAMILY,
        size: FONT_SIZE,
      }),
      new TextRun('\t'),
      new TextRun({
        text: '', // Empty placeholder ready for student to enter page number
        bold: isBold,
        font: FONT_FAMILY,
        size: FONT_SIZE,
      }),
    ],
  });
}

/**
 * Creates a List of Figures / Appendices entry.
 */
function createListRow(col1: string, col2: string): Paragraph {
  return new Paragraph({
    spacing: DOUBLE_SPACE,
    tabStops: [
      {
        type: TabStopType.RIGHT,
        position: TOC_TAB_POSITION,
        leader: LeaderType.DOT,
      },
    ],
    children: [
      new TextRun({
        text: col1,
        font: FONT_FAMILY,
        size: FONT_SIZE,
      }),
      new TextRun('\t'),
      new TextRun({
        text: col2,
        font: FONT_FAMILY,
        size: FONT_SIZE,
      }),
    ],
  });
}

export const narrativeReportDocxGenerator = {
  /**
   * Generates a complete CvSU Standard OJT Narrative Report DOCX Buffer.
   */
  async generate(data: NarrativeReportData): Promise<Buffer> {
    const studentName = data.studentName || 'STUDENT NAME';
    const degree = data.degreeProgram || 'Bachelor of Science in Computer Science';
    const department = data.department || 'Department of Computer Studies';
    const institution = data.institution || 'Cavite State University';
    const campus = data.campus || 'Bacoor City Campus';
    const campusAddress = data.campusAddress || 'Bacoor, Cavite';
    const company = data.companyName || 'NAME OF ESTABLISHMENT';
    const companyAddress = data.companyAddress || 'Establishment Address';
    const adviser = data.adviserName || 'Adviser Name';
    const monthYear = data.reportMonthYear || 'September 2025';
    const startDate = data.startDate || 'Start Date';
    const endDate = data.endDate || 'End Date';

    // ── SECTION 1: TITLE PAGE (Unnumbered) ──────────────────────────────────
    const section1Children: Paragraph[] = [
      // Spacing from top
      createEmptyLine(),
      createEmptyLine(),
      createEmptyLine(),
      // Top Report Title
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: 360, before: 0, after: 0 },
        children: [
          new TextRun({
            text: `ON-THE-JOB TRAINING EXPERIENCE AT ${company.toUpperCase()}`,
            bold: true,
            font: FONT_FAMILY,
            size: TITLE_SIZE,
          }),
        ],
      }),
      // Spacer down
      createEmptyLine(),
      createEmptyLine(),
      createEmptyLine(),
      createEmptyLine(),
      createEmptyLine(),
      createEmptyLine(),
      // Subtitle
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: SINGLE_SPACE,
        children: [
          new TextRun({
            text: 'A Narrative Report',
            font: FONT_FAMILY,
            size: FONT_SIZE,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: SINGLE_SPACE,
        children: [
          new TextRun({
            text: 'Submitted to the Faculty of the',
            font: FONT_FAMILY,
            size: FONT_SIZE,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: SINGLE_SPACE,
        children: [
          new TextRun({
            text: department,
            font: FONT_FAMILY,
            size: FONT_SIZE,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: SINGLE_SPACE,
        children: [
          new TextRun({
            text: institution,
            font: FONT_FAMILY,
            size: FONT_SIZE,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: SINGLE_SPACE,
        children: [
          new TextRun({
            text: campus,
            font: FONT_FAMILY,
            size: FONT_SIZE,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: SINGLE_SPACE,
        children: [
          new TextRun({
            text: campusAddress,
            font: FONT_FAMILY,
            size: FONT_SIZE,
          }),
        ],
      }),
      // Spacer down
      createEmptyLine(),
      createEmptyLine(),
      createEmptyLine(),
      createEmptyLine(),
      createEmptyLine(),
      createEmptyLine(),
      // Partial fulfillment
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: SINGLE_SPACE,
        children: [
          new TextRun({
            text: 'In partial fulfillment',
            font: FONT_FAMILY,
            size: FONT_SIZE,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: SINGLE_SPACE,
        children: [
          new TextRun({
            text: 'of the requirements for the degree,',
            font: FONT_FAMILY,
            size: FONT_SIZE,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: SINGLE_SPACE,
        children: [
          new TextRun({
            text: degree,
            font: FONT_FAMILY,
            size: FONT_SIZE,
          }),
        ],
      }),
      // Spacer down to author
      createEmptyLine(),
      createEmptyLine(),
      createEmptyLine(),
      createEmptyLine(),
      createEmptyLine(),
      createEmptyLine(),
      createEmptyLine(),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: SINGLE_SPACE,
        children: [
          new TextRun({
            text: studentName.toUpperCase(),
            bold: true,
            font: FONT_FAMILY,
            size: TITLE_SIZE,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: SINGLE_SPACE,
        children: [
          new TextRun({
            text: monthYear,
            font: FONT_FAMILY,
            size: FONT_SIZE,
          }),
        ],
      }),
    ];

    // ── SECTION 2: PRELIMINARIES (Roman Numerals: i, ii, iii...) ─────────────
    const section2Children: Paragraph[] = [
      // 1. APPROVAL SHEET (Clean title-only page for scanned copy)
      createMajorHeading('APPROVAL SHEET'),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: DOUBLE_SPACE,
        children: [
          new TextRun({
            text: '[Attach / Insert Scanned Signed Approval Sheet here]',
            italics: true,
            font: FONT_FAMILY,
            size: FONT_SIZE,
            color: '888888',
          }),
        ],
      }),
      new Paragraph({ children: [new PageBreak()] }),

      // 2. BIOGRAPHICAL DATA
      createMajorHeading('BIOGRAPHICAL DATA'),
      createBodyParagraph(
        `I, ${studentName}, born on the [Day] of [Month, Year]. [Insert personal background, residence, and family background here].`
      ),
      createBodyParagraph(
        'When it comes to my educational attainment, I finished my elementary education at [Elementary School Name] in the year [Year]. On the other hand, I completed my junior high school at [Junior High School Name] in [Year], and senior high school at [Senior High School Name] in [Year] with [Strand] as my strand.'
      ),
      createBodyParagraph(
        `And in [Year], I took ${degree} at ${institution} – ${campus}. [Insert expected year of graduation and personal career outlook here].`
      ),
      new Paragraph({ children: [new PageBreak()] }),

      // 3. ACKNOWLEDGEMENT (Title only, student writes authentic text)
      createMajorHeading('ACKNOWLEDGEMENT'),
      createBodyParagraph(
        '[Compose your personal expressions of gratitude and acknowledgement here to thank your parents, university faculty, OJT adviser, company mentors, co-interns, and the Almighty.]'
      ),
      createEmptyLine(),
      createEmptyLine(),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: DOUBLE_SPACE,
        children: [
          new TextRun({
            text: studentName.toUpperCase(),
            bold: true,
            font: FONT_FAMILY,
            size: FONT_SIZE,
          }),
        ],
      }),
      new Paragraph({ children: [new PageBreak()] }),

      // 4. TABLE OF CONTENTS
      createMajorHeading('TABLE OF CONTENTS'),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: DOUBLE_SPACE,
        children: [
          new TextRun({
            text: 'Page',
            bold: true,
            font: FONT_FAMILY,
            size: FONT_SIZE,
          }),
        ],
      }),
      createTocEntry('BIOGRAPHICAL DATA', true),
      createTocEntry('ACKNOWLEDGEMENT', true),
      createTocEntry('TABLE OF CONTENTS', true),
      createTocEntry('LIST OF FIGURES', true),
      createTocEntry('LIST OF APPENDIX FIGURES', true),
      createTocEntry('LIST OF APPENDICES', true),
      createTocEntry('INTRODUCTION', true),
      createTocEntry('Objectives of the On-the-Job Training', false, true),
      createTocEntry('Significance of On-the-Job Training', false, true),
      createTocEntry('Time and Place of the On-the-Job Training', false, true),
      createTocEntry('THE LINKAGE ESTABLISHMENT', true),
      createTocEntry('Location of the Establishment', false, true),
      createTocEntry('Background/Profile of the Establishment', false, true),
      createTocEntry('Vision and Mission Statements of the Establishment', false, true),
      createTocEntry('Goals and Objectives of the Establishment', false, true),
      createTocEntry('Overall Organizational Structure and Duties and Responsibilities', false, true),
      createTocEntry('THE TRAINING AREA', true),
      createTocEntry('Department Function', false, true),
      createTocEntry('Organizational Structure of the Department, Functions, & Responsibilities', false, true),
      createTocEntry('Facilities', false, true),
      createTocEntry('Equipment', false, true),
      createTocEntry('Standard Operating Procedures', false, true),
      createTocEntry('THE TRAINING EXPERIENCE', true),
      createTocEntry('Tasks Performed/Specific Activities Assigned', false, true),
      createTocEntry('Observed Strengths of the Training Area', false, true),
      createTocEntry('Problems Encountered', false, true),
      createTocEntry('SUMMARY', true),
      createTocEntry('REFERENCES', true),
      createTocEntry('APPENDICES', true),
      new Paragraph({ children: [new PageBreak()] }),

      // 5. LIST OF FIGURES
      createMajorHeading('LIST OF FIGURES'),
      new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: TOC_TAB_POSITION }],
        spacing: DOUBLE_SPACE,
        children: [
          new TextRun({ text: 'Figure', bold: true, font: FONT_FAMILY, size: FONT_SIZE }),
          new TextRun('\t'),
          new TextRun({ text: 'Page', bold: true, font: FONT_FAMILY, size: FONT_SIZE }),
        ],
      }),
      createListRow('1   Location map of the Establishment', ''),
      createListRow('2   Establishment Logo', ''),
      createListRow('3   Organizational Chart of the Establishment', ''),
      createListRow('4   Organizational Structure of the Assigned Department', ''),
      createListRow('5   Facilities and Entrance Hall', ''),
      createListRow('6   Production and Work Area', ''),
      createListRow('7   Department Office and Conference Area', ''),
      createListRow('8   Assigned Workstation and Hardware Setup', ''),
      new Paragraph({ children: [new PageBreak()] }),

      // 6. LIST OF APPENDIX FIGURES
      createMajorHeading('LIST OF APPENDIX FIGURES'),
      new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: TOC_TAB_POSITION }],
        spacing: DOUBLE_SPACE,
        children: [
          new TextRun({ text: 'Appendix Figure', bold: true, font: FONT_FAMILY, size: FONT_SIZE }),
          new TextRun('\t'),
          new TextRun({ text: 'Page', bold: true, font: FONT_FAMILY, size: FONT_SIZE }),
        ],
      }),
      createListRow('1   Approved Endorsement Letter', ''),
      createListRow('2   Resume', ''),
      createListRow('3   Approved Job Description', ''),
      createListRow('4   Parent Certification of Waiver of OJT Practicum', ''),
      createListRow('5   Trainee Industry Agreement Liability Waiver', ''),
      createListRow('6   Notarized Memorandum of Agreement', ''),
      createListRow('7   OJT Placement Form', ''),
      createListRow('8   Training Schedule Form', ''),
      createListRow('9   Student Trainee Evaluation Record', ''),
      createListRow('10  Certificate of Completion', ''),
      createListRow('11  Daily Time Record', ''),
      createListRow('12  Identification Card', ''),
      createListRow('13  Workstation Setup and Tools Used', ''),
      createListRow('14  Photo Documentation of Daily Tasks and Events', ''),
      new Paragraph({ children: [new PageBreak()] }),

      // 7. LIST OF APPENDICES
      createMajorHeading('LIST OF APPENDICES'),
      new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: TOC_TAB_POSITION }],
        spacing: DOUBLE_SPACE,
        children: [
          new TextRun({ text: 'Appendix', bold: true, font: FONT_FAMILY, size: FONT_SIZE }),
          new TextRun('\t'),
          new TextRun({ text: 'Page', bold: true, font: FONT_FAMILY, size: FONT_SIZE }),
        ],
      }),
      createListRow('1   Endorsement Letter', ''),
      createListRow('2   Resume', ''),
      createListRow('3   Job Description', ''),
      createListRow('4   Parent Certification of Waiver of OJT Practicum', ''),
      createListRow('5   Trainee Industry Agreement Liability Waiver', ''),
      createListRow('6   Notarized Memorandum of Agreement', ''),
      createListRow('7   OJT Placement Form', ''),
      createListRow('8   Training Schedule Form', ''),
      createListRow('9   Graded Student Evaluation Form', ''),
      createListRow('10  Certificate of Completion', ''),
      createListRow('11  Daily Time Record', ''),
      createListRow('12  Daily Reflective Journal', ''),
      createListRow('13  Identification Card', ''),
      createListRow('14  Photo Documentation', ''),
    ];

    // ── SECTION 3: MAIN BODY (Arabic Numerals: 1, 2, 3...) ────────────────────
    const section3Children: Paragraph[] = [
      // 1. INTRODUCTION COVER & PREFACE
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: SINGLE_SPACE,
        children: [
          new TextRun({
            text: `ON-THE-JOB TRAINING EXPERIENCES AT ${company.toUpperCase()}`,
            bold: true,
            font: FONT_FAMILY,
            size: TITLE_SIZE,
          }),
        ],
      }),
      createEmptyLine(),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: SINGLE_SPACE,
        children: [
          new TextRun({
            text: studentName.toUpperCase(),
            bold: true,
            font: FONT_FAMILY,
            size: FONT_SIZE,
          }),
        ],
      }),
      createEmptyLine(),
      new Paragraph({
        alignment: AlignmentType.BOTH,
        spacing: DOUBLE_SPACE,
        children: [
          new TextRun({
            text: `A narrative report submitted to the faculty of the ${department}, ${institution}, ${campus}, in partial fulfillment of the requirements for the degree of ${degree}, with Contribution No. __________. Prepared under the supervision of ${adviser}.`,
            font: FONT_FAMILY,
            size: FONT_SIZE,
          }),
        ],
      }),
      createEmptyLine(),
      createMajorHeading('INTRODUCTION'),
      createBodyParagraph(
        'On-the-job training (OJT) or internship is part of this university’s curriculum that aims to train and orient students about workplace standards, professional practice, and career readiness. One of the oldest and most effective forms of experiential learning, OJT bridges the gap between academic theory and industry practice.'
      ),
      createBodyParagraph(
        `During the training period at ${company}, the trainee was exposed to real-world tasks, organizational workflows, and collaborative problem-solving that helped enhance technical proficiency and soft skills in a professional setting.`
      ),

      createSubHeading('Objectives of the On-the-Job Training'),
      createBodyParagraph(
        `${institution} – ${campus} designed an internship curriculum that allows students to gain realistic exposure to organizational environments. Specifically, the trainee aimed to:`
      ),
      createBodyParagraph('1. Gain technical skills and practical industry experience through hands-on tasks;', false),
      createBodyParagraph('2. Collaborate with colleagues and supervisors in achieving departmental goals;', false),
      createBodyParagraph('3. Enhance communication, accountability, and professional discipline; and', false),
      createBodyParagraph('4. Explore industry-standard technologies and methodologies throughout the OJT period.', false),

      createSubHeading('Significance of On-the-Job Training'),
      createBodyParagraph(
        'The On-the-Job Training program is significant as it provides experiential learning that cannot be fully replicated in a traditional classroom. It allows students to adapt to company policies, adhere to workplace standards, and develop problem-solving skills under direct professional supervision.'
      ),

      createSubHeading('Time and Place of the On-the-Job Training'),
      createBodyParagraph(
        `The On-the-Job Training started on ${startDate} and concluded on ${endDate}. It was conducted at ${company}, located at ${companyAddress}.`
      ),
      new Paragraph({ children: [new PageBreak()] }),

      // 2. THE LINKAGE ESTABLISHMENT
      createMajorHeading('THE LINKAGE ESTABLISHMENT'),
      createSubHeading('Location of the Establishment'),
      createBodyParagraph(
        `${company} is located at ${companyAddress}. [Insert narrative describing the establishment location, transportation accessibility, and surrounding area].`
      ),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: DOUBLE_SPACE,
        children: [
          new TextRun({
            text: `Figure 1. Location map of ${company}`,
            italics: true,
            font: FONT_FAMILY,
            size: FONT_SIZE,
          }),
        ],
      }),
      createEmptyLine(),

      createSubHeading('Background/Profile of the Establishment'),
      createBodyParagraph(
        `[Insert background, history, founder information, and corporate growth of ${company} here].`
      ),

      createSubHeading('Vision and Mission Statements of the Establishment'),
      createBodyParagraph(`${company} Mission:`, false),
      createBodyParagraph('“[Insert Establishment Mission statement here]”', true),
      createBodyParagraph(`${company} Vision:`, false),
      createBodyParagraph('“[Insert Establishment Vision statement here]”', true),

      createSubHeading('Goals and Objectives of the Establishment'),
      createBodyParagraph(
        `[Insert corporate goals and objectives of ${company} here].`
      ),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: DOUBLE_SPACE,
        children: [
          new TextRun({
            text: `Figure 2. The ${company} Logo`,
            italics: true,
            font: FONT_FAMILY,
            size: FONT_SIZE,
          }),
        ],
      }),

      createSubHeading('Overall Organizational Structure and Duties and Responsibilities'),
      createBodyParagraph(
        `[Insert details regarding the executive hierarchy, organizational divisions, and primary responsibilities of ${company}].`
      ),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: DOUBLE_SPACE,
        children: [
          new TextRun({
            text: `Figure 3. Organizational Chart of ${company}`,
            italics: true,
            font: FONT_FAMILY,
            size: FONT_SIZE,
          }),
        ],
      }),
      new Paragraph({ children: [new PageBreak()] }),

      // 3. THE TRAINING AREA
      createMajorHeading('THE TRAINING AREA'),
      createSubHeading('Department Function'),
      createBodyParagraph(
        '[Insert detailed function and primary role of the specific department where the trainee was assigned].'
      ),

      createSubHeading('Organizational Structure of the Department, Functions, & Responsibilities'),
      createBodyParagraph(
        '[Insert department head, supervisors, senior staff hierarchy, and key responsibilities within the unit].'
      ),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: DOUBLE_SPACE,
        children: [
          new TextRun({
            text: 'Figure 4. Organizational Structure of the Assigned Department',
            italics: true,
            font: FONT_FAMILY,
            size: FONT_SIZE,
          }),
        ],
      }),

      createSubHeading('Facilities'),
      createBodyParagraph(
        '[Describe physical or remote work facilities, office layouts, conference rooms, and operational spaces].'
      ),

      createSubHeading('Equipment'),
      createBodyParagraph(
        '[Specify workstation specifications: CPU model, RAM, storage, monitor, peripherals, operating system, and software packages utilized during the internship].'
      ),

      createSubHeading('Standard Operating Procedures'),
      createBodyParagraph(
        '[Explain official work hours, attendance monitoring, break schedules, ticketing procedures, communication platforms, and office protocols].'
      ),
      new Paragraph({ children: [new PageBreak()] }),

      // 4. THE TRAINING EXPERIENCE
      createMajorHeading('THE TRAINING EXPERIENCE'),
      createSubHeading('Tasks Performed/Specific Activities Assigned'),
      createBodyParagraph(
        '[Detail the technical tasks, projects, system maintenance, troubleshooting, or development activities accomplished throughout the internship]:'
      ),
      createBodyParagraph('• [Task 1: Description of activity, tools utilized, and outcome achieved]', false),
      createBodyParagraph('• [Task 2: Description of activity, tools utilized, and outcome achieved]', false),
      createBodyParagraph('• [Task 3: Description of activity, tools utilized, and outcome achieved]', false),
      createBodyParagraph('• [Task 4: Description of activity, tools utilized, and outcome achieved]', false),

      createSubHeading('Observed Strengths of the Training Area'),
      createBodyParagraph(
        'The trainee observed several organizational strengths in the training area, including:'
      ),
      createBodyParagraph('• Supportive and approachable mentors and senior staff members;', false),
      createBodyParagraph('• Organized workflow and clear task delegation protocols;', false),
      createBodyParagraph('• Adaptive work environment that encourages proactive learning; and', false),
      createBodyParagraph('• Modern technological infrastructure enabling efficient operations.', false),

      createSubHeading('Insights'),
      createBodyParagraph(
        '[Reflect on your personal and professional growth, key takeaways, adapting to corporate culture, and how the internship shaped your future career path].'
      ),

      createSubHeading('Problems Encountered'),
      createBodyParagraph(
        '[Discuss technical, procedural, or operational challenges faced during the internship and how you or the team addressed and resolved them].'
      ),
      new Paragraph({ children: [new PageBreak()] }),

      // 5. SUMMARY
      createMajorHeading('SUMMARY'),
      createBodyParagraph(
        `This On-the-Job Training narrative report details the internship experience of ${studentName}, a student of ${degree} at ${institution} – ${campus}. The training was conducted at ${company} from ${startDate} to ${endDate}.`
      ),
      createBodyParagraph(
        'The internship provided invaluable hands-on learning, bridging academic concepts with industrial application. The exposure to enterprise workflows, professional collaboration, and technical challenges enhanced the trainee’s competence, problem-solving skills, and career readiness.'
      ),
      new Paragraph({ children: [new PageBreak()] }),

      // 6. REFERENCES
      createMajorHeading('REFERENCES'),
      createBodyParagraph(
        '[Insert academic, industry, or textbook references in standard APA 7th edition format].'
      ),
      new Paragraph({ children: [new PageBreak()] }),

      // 7. APPENDICES (Divider page)
      createEmptyLine(),
      createEmptyLine(),
      createEmptyLine(),
      createEmptyLine(),
      createEmptyLine(),
      createMajorHeading('APPENDICES'),
      new Paragraph({ children: [new PageBreak()] }),

      // Individual Appendix placeholders (1 to 14)
      createSubHeading('Appendix 1. Endorsement Letter'),
      createBodyParagraph('[Attach copy of Approved Endorsement Letter here]'),
      new Paragraph({ children: [new PageBreak()] }),

      createSubHeading('Appendix 2. Resume'),
      createBodyParagraph('[Attach copy of Resume here]'),
      new Paragraph({ children: [new PageBreak()] }),

      createSubHeading('Appendix 3. Approved Job Description'),
      createBodyParagraph('[Attach copy of Job Description here]'),
      new Paragraph({ children: [new PageBreak()] }),

      createSubHeading('Appendix 4. Parent Certification of Waiver of OJT Practicum'),
      createBodyParagraph('[Attach copy of Parent Certification of Waiver here]'),
      new Paragraph({ children: [new PageBreak()] }),

      createSubHeading('Appendix 5. Trainee Industry Agreement Liability Waiver'),
      createBodyParagraph('[Attach copy of Trainee Industry Agreement Liability Waiver here]'),
      new Paragraph({ children: [new PageBreak()] }),

      createSubHeading('Appendix 6. Notarized Memorandum of Agreement'),
      createBodyParagraph('[Attach copy of Notarized Memorandum of Agreement here]'),
      new Paragraph({ children: [new PageBreak()] }),

      createSubHeading('Appendix 7. OJT Placement Form'),
      createBodyParagraph('[Attach copy of OJT Placement Form here]'),
      new Paragraph({ children: [new PageBreak()] }),

      createSubHeading('Appendix 8. Training Schedule Form'),
      createBodyParagraph('[Attach copy of Training Schedule Form here]'),
      new Paragraph({ children: [new PageBreak()] }),

      createSubHeading('Appendix 9. Graded Student Evaluation Form'),
      createBodyParagraph('[Attach copy of Graded Student Evaluation Form here]'),
      new Paragraph({ children: [new PageBreak()] }),

      createSubHeading('Appendix 10. Certificate of Completion'),
      createBodyParagraph('[Attach copy of Certificate of Completion here]'),
      new Paragraph({ children: [new PageBreak()] }),

      createSubHeading('Appendix 11. Daily Time Record'),
      createBodyParagraph('[Attach copy of Approved Daily Time Record here]'),
      new Paragraph({ children: [new PageBreak()] }),

      createSubHeading('Appendix 12. Daily Reflective Journal'),
      createBodyParagraph('[Attach copy of Daily Reflective Journals here]'),
      new Paragraph({ children: [new PageBreak()] }),

      createSubHeading('Appendix 13. Identification Card'),
      createBodyParagraph('[Attach copy of Company ID here]'),
      new Paragraph({ children: [new PageBreak()] }),

      createSubHeading('Appendix 14. Photo Documentation'),
      createBodyParagraph('[Attach photo documentation with captions here]'),
    ];

    // ── DOCUMENT ASSEMBLY ───────────────────────────────────────────────────
    const doc = new Document({
      sections: [
        // Section 1: Title Page (Unnumbered, no header)
        {
          properties: {
            page: {
              size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
              margin: {
                left: MARGIN_LEFT,
                right: MARGIN_RIGHT,
                top: MARGIN_TOP,
                bottom: MARGIN_BOTTOM,
              },
            },
          },
          children: section1Children,
        },
        // Section 2: Preliminaries (Roman Numerals: i, ii, iii... in top-right header)
        {
          properties: {
            type: SectionType.NEXT_PAGE,
            page: {
              size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
              margin: {
                left: MARGIN_LEFT,
                right: MARGIN_RIGHT,
                top: MARGIN_TOP,
                bottom: MARGIN_BOTTOM,
              },
              pageNumbers: {
                start: 1,
                formatType: NumberFormat.LOWER_ROMAN,
              },
            },
          },
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  spacing: SINGLE_SPACE,
                  children: [
                    new TextRun({
                      font: FONT_FAMILY,
                      size: FONT_SIZE,
                      children: [PageNumber.CURRENT],
                    }),
                  ],
                }),
              ],
            }),
          },
          children: section2Children,
        },
        // Section 3: Main Body (Arabic Numerals: 1, 2, 3... in top-right header)
        {
          properties: {
            type: SectionType.NEXT_PAGE,
            page: {
              size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
              margin: {
                left: MARGIN_LEFT,
                right: MARGIN_RIGHT,
                top: MARGIN_TOP,
                bottom: MARGIN_BOTTOM,
              },
              pageNumbers: {
                start: 1,
                formatType: NumberFormat.DECIMAL,
              },
            },
          },
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  spacing: SINGLE_SPACE,
                  children: [
                    new TextRun({
                      font: FONT_FAMILY,
                      size: FONT_SIZE,
                      children: [PageNumber.CURRENT],
                    }),
                  ],
                }),
              ],
            }),
          },
          children: section3Children,
        },
      ],
    });

    return await Packer.toBuffer(doc);
  },
};
