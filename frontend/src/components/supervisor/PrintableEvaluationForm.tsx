'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { GradingScaleRange } from '@/lib/api/supervisor-rubrics';

interface CriterionScore {
  criterion_code: string;
  criterion_name: string;
  score: number;
}

interface PrintableEvaluationFormProps {
  open: boolean;
  onClose: () => void;
  studentName: string;
  studentProgram: string;
  companyName: string;
  position: string;
  workPeriod: string;
  criterionScores: CriterionScore[];
  totalScore: number;
  gradeEquivalent: number | null;
  attendance: string;
  punctuality: string;
  supervisorComments: string;
  supervisorName: string;
  gradingScale: GradingScaleRange[];
}

// The 7 criteria that match the CvSU form exactly
const CVSU_CRITERIA_LABELS: Record<string, { label: string; descriptions: string[] }> = {
  'quality_of_work': {
    label: 'A. Quality of Work',
    descriptions: ['Often unsatisfactory', 'Usually acceptable', 'Consistently satisfactory', 'Sometimes superior', 'Consistently superior'],
  },
  'attitude_toward_work': {
    label: 'B. Attitude Toward Work',
    descriptions: ['Definitely not interested', 'Somewhat different', 'Average in diligence and interest', 'Very interested and industrious', 'Outstanding in enthusiasm'],
  },
  'judgment': {
    label: 'C. Judgment',
    descriptions: ['Consistently uses poor judgement', 'Often uses poor judgement', 'Usually makes the right decision', 'Above average in making decisions', 'Exceptionally mature'],
  },
  'cooperation': {
    label: 'D. Cooperation',
    descriptions: ['Unwilling to accept and carry out instructions', 'Seldom willing to accept and carry out instructions', 'Generally willing to accept and carry out instructions', 'Always willing to accept and carry out instructions', 'Quick to volunteer in accepting and carrying out instructions'],
  },
  'dependability': {
    label: 'E. Dependability',
    descriptions: ['Frequently undependable', 'Occasionally undependable', 'Dependable in most aspects', 'Dependable in all aspects', 'Highly dependable; inspires others'],
  },
  'comprehension': {
    label: 'F. Comprehension',
    descriptions: ['Needs repeated numerously', 'Needs repeated in certain occasions', 'Generally understands instructions', 'Understands instructions instantly', 'Understands instructions instantly; exceeds standards'],
  },
  'safety': {
    label: 'G. Safety',
    descriptions: ['Careless of own and others\' safety', 'Sometimes fails to see or report unsafe conditions', 'Careful, takes precaution not to injure self or others', 'Observes visible hazards; suggests need for improvement', 'Quick to respond to some possible hazards and takes steps to get them corrected'],
  },
};

// Try to match a criterion score to a CvSU form row by code or name
function matchCriterion(cs: CriterionScore): { label: string; descriptions: string[] } | null {
  const code = cs.criterion_code.toLowerCase();
  const name = cs.criterion_name.toLowerCase();

  if (code.includes('quality') || name.includes('quality of work')) return CVSU_CRITERIA_LABELS['quality_of_work'];
  if (code.includes('attitude') || name.includes('attitude')) return CVSU_CRITERIA_LABELS['attitude_toward_work'];
  if (code.includes('judgment') || code.includes('judgement') || name.includes('judgment') || name.includes('judgement')) return CVSU_CRITERIA_LABELS['judgment'];
  if (code.includes('cooperation') || name.includes('cooperation')) return CVSU_CRITERIA_LABELS['cooperation'];
  if (code.includes('dependab') || name.includes('dependab')) return CVSU_CRITERIA_LABELS['dependability'];
  if (code.includes('comprehen') || name.includes('comprehen')) return CVSU_CRITERIA_LABELS['comprehension'];
  if (code.includes('safety') || name.includes('safety')) return CVSU_CRITERIA_LABELS['safety'];

  return null;
}

export default function PrintableEvaluationForm({
  open,
  onClose,
  studentName,
  studentProgram,
  companyName,
  position,
  workPeriod,
  criterionScores,
  totalScore,
  gradeEquivalent,
  attendance,
  punctuality,
  supervisorComments,
  supervisorName,
  gradingScale,
}: PrintableEvaluationFormProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    const printContent = printRef.current;
    if (!printContent) return;

    // Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    // Get the HTML content
    const htmlContent = printContent.innerHTML;

    // Write the document
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title></title>
        <style>
          @page {
            size: A4;
            margin: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            color: #000;
            line-height: 1.3;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color-adjust: exact;
            padding: 10mm 10mm;
          }
          table { width: 100%; border-collapse: collapse; }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `);
    doc.close();

    // Wait for content (specifically the logo) to load then print
    iframe.onload = () => {
        setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            
            // Clean up the iframe after a delay
            setTimeout(() => {
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
            }, 1000);
        }, 500);
    };
  }, [studentName]);

  // Determine which score range the total falls into for highlighting
  const getScoreRangeHighlight = (minScore: number, maxScore: number) => {
    return totalScore >= minScore && totalScore <= maxScore;
  };

  // Build the grading scale rows from DB data
  const sortedScale = [...gradingScale].sort((a, b) => a.min_score - b.min_score);

  const today = new Date().toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Convert logo to absolute URL for print
  const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/cvsu-logo.png` : '/cvsu-logo.png';

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-[900px] h-[90vh] flex flex-col p-0 gap-0">
          {/* Action Bar — hidden during print, fixed at top */}
          <div className="print-hide flex-shrink-0 bg-background border-b px-6 py-4 flex items-center justify-between pr-14">
            <DialogTitle className="font-semibold text-lg">Evaluation Form Preview</DialogTitle>
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" />
              Print Form
            </Button>
          </div>

          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto">

          {/* Printable Form Content */}
          <div
            id="printable-evaluation-form-container"
            ref={printRef}
            className="p-8 bg-white text-black"
            style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#000' }}
          >
            {/* Header with CvSU Logo */}
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt="CvSU Logo"
                style={{ width: '55px', height: '55px', margin: '0 auto 4px', display: 'block' }}
              />
              <div style={{ fontSize: '10px', fontStyle: 'italic' }}>Republic of the Philippines</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>CAVITE STATE UNIVERSITY</div>
              <div style={{ fontSize: '13px', fontWeight: 'bold' }}>Bacoor City Campus</div>
              <div style={{ fontSize: '9px' }}>SHIV, Molino VI, City of Bacoor</div>
              <div style={{ fontSize: '9px' }}>☎ (046) 476-5029</div>
              <div style={{ fontSize: '9px' }}>✉ cvsubacoor@cvsu.edu.ph</div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '10px' }}>ON-THE-JOB TRAINEE PROGRAM</div>
              <div style={{ fontSize: '12px', fontWeight: 'bold' }}>STUDENT TRAINEE EVALUATION RECORD</div>
            </div>

            {/* Instruction */}
            <div style={{ margin: '8px 0', fontSize: '9px', lineHeight: '1.4' }}>
              <strong style={{ fontSize: '10px' }}>INSTRUCTION TO THE SUPERVISOR</strong><br />
              Read rating factors and classification carefully. For each factor, pick the number on the graduate scale which corresponds to your evaluation
              of the student trainee. Record the scale for each factor in the column to the right. Calculate the total score for all factors. Determine overall performance
              rating by highlighting the corresponding boxes with yellow.
            </div>

            {/* Student Info Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '3px 6px', fontWeight: 'bold', whiteSpace: 'nowrap', width: '140px', fontSize: '10px' }}>NAME OF THE STUDENT TRAINEE:</td>
                  <td style={{ border: '1px solid #000', padding: '3px 6px', fontSize: '10px' }}>{studentName}</td>
                  <td style={{ border: '1px solid #000', padding: '3px 6px', fontWeight: 'bold', whiteSpace: 'nowrap', fontSize: '10px' }}>COURSE:</td>
                  <td style={{ border: '1px solid #000', padding: '3px 6px', fontSize: '10px' }}>{studentProgram}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '3px 6px', fontWeight: 'bold', fontSize: '10px' }}>COMPANY:</td>
                  <td colSpan={3} style={{ border: '1px solid #000', padding: '3px 6px', fontSize: '10px' }}>{companyName}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '3px 6px', fontWeight: 'bold', fontSize: '10px' }}>CURRENT ASSIGNMENT:</td>
                  <td style={{ border: '1px solid #000', padding: '3px 6px', fontSize: '10px' }}>{position}</td>
                  <td style={{ border: '1px solid #000', padding: '3px 6px', fontWeight: 'bold', whiteSpace: 'nowrap', fontSize: '10px' }}>WORK PERIOD:</td>
                  <td style={{ border: '1px solid #000', padding: '3px 6px', fontSize: '10px' }}>{workPeriod}</td>
                </tr>
              </tbody>
            </table>

            {/* Criteria Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #000', padding: '3px 4px', fontSize: '9px', backgroundColor: '#f0f0f0' }}></th>
                  <th style={{ border: '1px solid #000', padding: '3px 4px', fontSize: '9px', backgroundColor: '#f0f0f0' }}>1</th>
                  <th style={{ border: '1px solid #000', padding: '3px 4px', fontSize: '9px', backgroundColor: '#f0f0f0' }}>2</th>
                  <th style={{ border: '1px solid #000', padding: '3px 4px', fontSize: '9px', backgroundColor: '#f0f0f0' }}>3</th>
                  <th style={{ border: '1px solid #000', padding: '3px 4px', fontSize: '9px', backgroundColor: '#f0f0f0' }}>4</th>
                  <th style={{ border: '1px solid #000', padding: '3px 4px', fontSize: '9px', backgroundColor: '#f0f0f0' }}>5</th>
                  <th style={{ border: '1px solid #000', padding: '3px 4px', fontSize: '9px', backgroundColor: '#f0f0f0' }}>6</th>
                  <th style={{ border: '1px solid #000', padding: '3px 4px', fontSize: '9px', backgroundColor: '#f0f0f0' }}>7</th>
                  <th style={{ border: '1px solid #000', padding: '3px 4px', fontSize: '9px', backgroundColor: '#f0f0f0' }}>8</th>
                  <th style={{ border: '1px solid #000', padding: '3px 4px', fontSize: '9px', backgroundColor: '#f0f0f0' }}>9</th>
                  <th style={{ border: '1px solid #000', padding: '3px 4px', fontSize: '9px', backgroundColor: '#f0f0f0' }}>10</th>
                  <th style={{ border: '1px solid #000', padding: '3px 4px', fontSize: '9px', backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>SCORE</th>
                </tr>
                <tr>
                  <th style={{ border: '1px solid #000', padding: '3px 4px', fontSize: '9px', backgroundColor: '#f0f0f0' }}></th>
                  <th colSpan={2} style={{ border: '1px solid #000', padding: '3px 4px', fontSize: '8px', backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>POOR</th>
                  <th colSpan={2} style={{ border: '1px solid #000', padding: '3px 4px', fontSize: '8px', backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>FAIRLY SATISFACTORY</th>
                  <th colSpan={2} style={{ border: '1px solid #000', padding: '3px 4px', fontSize: '8px', backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>SATISFACTORY</th>
                  <th colSpan={2} style={{ border: '1px solid #000', padding: '3px 4px', fontSize: '8px', backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>VERY GOOD</th>
                  <th colSpan={2} style={{ border: '1px solid #000', padding: '3px 4px', fontSize: '8px', backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>OUTSTANDING</th>
                  <th style={{ border: '1px solid #000', padding: '3px 4px', fontSize: '9px', backgroundColor: '#f0f0f0' }}></th>
                </tr>
              </thead>
              <tbody>
                {criterionScores.map((cs, idx) => {
                  const matched = matchCriterion(cs);
                  const label = matched?.label || `${String.fromCharCode(65 + idx)}. ${cs.criterion_name}`;
                  const descs = matched?.descriptions || ['', '', '', '', ''];
                  return (
                    <tr key={idx}>
                      <td style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'left', fontWeight: 'bold', width: '130px', fontSize: '10px' }}>{label}</td>
                      <td colSpan={2} style={{ border: '1px solid #000', padding: '3px 4px', fontSize: '8px', fontStyle: 'italic', textAlign: 'center', backgroundColor: cs.score >= 1 && cs.score <= 2 ? '#ffff00' : undefined }}>{descs[0]}</td>
                      <td colSpan={2} style={{ border: '1px solid #000', padding: '3px 4px', fontSize: '8px', fontStyle: 'italic', textAlign: 'center', backgroundColor: cs.score >= 3 && cs.score <= 4 ? '#ffff00' : undefined }}>{descs[1]}</td>
                      <td colSpan={2} style={{ border: '1px solid #000', padding: '3px 4px', fontSize: '8px', fontStyle: 'italic', textAlign: 'center', backgroundColor: cs.score >= 5 && cs.score <= 6 ? '#ffff00' : undefined }}>{descs[2]}</td>
                      <td colSpan={2} style={{ border: '1px solid #000', padding: '3px 4px', fontSize: '8px', fontStyle: 'italic', textAlign: 'center', backgroundColor: cs.score >= 7 && cs.score <= 8 ? '#ffff00' : undefined }}>{descs[3]}</td>
                      <td colSpan={2} style={{ border: '1px solid #000', padding: '3px 4px', fontSize: '8px', fontStyle: 'italic', textAlign: 'center', backgroundColor: cs.score >= 9 && cs.score <= 10 ? '#ffff00' : undefined }}>{descs[4]}</td>
                      <td style={{ border: '1px solid #000', padding: '3px 4px', width: '45px', fontSize: '13px', fontWeight: 'bold', textAlign: 'center' }}>{cs.score}</td>
                    </tr>
                  );
                })}
                {/* Total Row */}
                <tr>
                  <td colSpan={11} style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'right', fontWeight: 'bold', fontSize: '11px' }}>Total:</td>
                  <td style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'center', fontWeight: 'bold', fontSize: '13px' }}>{totalScore}</td>
                </tr>
              </tbody>
            </table>

            {/* Overall Performance / Grade Equivalent Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }}>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '2px 4px', fontWeight: 'bold', fontSize: '9px' }}>OVERALL PERFORMANCE</td>
                  {sortedScale.map((range, idx) => (
                    <td key={idx} style={{
                      border: '1px solid #000',
                      padding: '2px 4px',
                      textAlign: 'center',
                      fontSize: '9px',
                      backgroundColor: getScoreRangeHighlight(range.min_score, range.max_score) ? '#ffff00' : undefined,
                    }}>
                      {range.min_score}-{range.max_score}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '2px 4px', fontWeight: 'bold', fontSize: '9px' }}>GRADE EQUIVALENT</td>
                  {sortedScale.map((range, idx) => (
                    <td key={idx} style={{
                      border: '1px solid #000',
                      padding: '2px 4px',
                      textAlign: 'center',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      backgroundColor: getScoreRangeHighlight(range.min_score, range.max_score) ? '#ffff00' : undefined,
                    }}>
                      {range.grade}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>

            {/* Attendance & Punctuality */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }}>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '4px 8px', fontSize: '10px', fontWeight: 'bold' }}>
                    ATTENDANCE<br /><span style={{ fontSize: '8px', fontWeight: 'normal' }}>(Please click on the box.)</span>
                  </td>
                  <td style={{ border: '1px solid #000', padding: '4px 8px', fontSize: '10px' }}>
                    <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '1px solid #000', marginRight: '4px', verticalAlign: 'middle', textAlign: 'center', lineHeight: '12px', fontSize: '10px', backgroundColor: attendance === 'regular' ? '#000' : undefined, color: attendance === 'regular' ? '#fff' : undefined }}>
                      {attendance === 'regular' ? '✓' : ''}
                    </span> Regular
                  </td>
                  <td style={{ border: '1px solid #000', padding: '4px 8px', fontSize: '10px' }}>
                    <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '1px solid #000', marginRight: '4px', verticalAlign: 'middle', textAlign: 'center', lineHeight: '12px', fontSize: '10px', backgroundColor: attendance === 'irregular' ? '#000' : undefined, color: attendance === 'irregular' ? '#fff' : undefined }}>
                      {attendance === 'irregular' ? '✓' : ''}
                    </span> Irregular
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '4px 8px', fontSize: '10px', fontWeight: 'bold' }}>
                    PUNCTUALITY<br /><span style={{ fontSize: '8px', fontWeight: 'normal' }}>(Please click on the box.)</span>
                  </td>
                  <td style={{ border: '1px solid #000', padding: '4px 8px', fontSize: '10px' }}>
                    <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '1px solid #000', marginRight: '4px', verticalAlign: 'middle', textAlign: 'center', lineHeight: '12px', fontSize: '10px', backgroundColor: punctuality === 'regular' ? '#000' : undefined, color: punctuality === 'regular' ? '#fff' : undefined }}>
                      {punctuality === 'regular' ? '✓' : ''}
                    </span> Regular
                  </td>
                  <td style={{ border: '1px solid #000', padding: '4px 8px', fontSize: '10px' }}>
                    <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '1px solid #000', marginRight: '4px', verticalAlign: 'middle', textAlign: 'center', lineHeight: '12px', fontSize: '10px', backgroundColor: punctuality === 'irregular' ? '#000' : undefined, color: punctuality === 'irregular' ? '#fff' : undefined }}>
                      {punctuality === 'irregular' ? '✓' : ''}
                    </span> Irregular
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Comments */}
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', fontStyle: 'italic', marginBottom: '4px' }}>
                Comments, general impressions and observations regarding the capability, behaviour, and personality of the trainee
              </div>
              <div style={{ borderBottom: '1px solid #000', minHeight: '18px', padding: '2px 0', fontSize: '10px', marginBottom: '4px', wordWrap: 'break-word' }}>
                {supervisorComments}
              </div>
              <div style={{ borderBottom: '1px solid #000', minHeight: '18px' }}></div>
              <div style={{ borderBottom: '1px solid #000', minHeight: '18px' }}></div>
            </div>

            {/* Signature Section */}
            <div style={{ marginTop: '40px', textAlign: 'right' }}>
              <div style={{ borderTop: '1px solid #000', width: '280px', marginLeft: 'auto', textAlign: 'center', paddingTop: '2px', fontSize: '9px', fontStyle: 'italic' }}>
                (Signature over Printed Name)
              </div>
              <table style={{ marginLeft: 'auto', marginTop: '6px', fontSize: '10px' }}>
                <tbody>
                  <tr>
                    <td style={{ textAlign: 'right', paddingRight: '8px' }}>Supervisor:</td>
                    <td style={{ fontWeight: 'bold' }}>{supervisorName}</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'right', paddingRight: '8px' }}>Position:</td>
                    <td>Company Supervisor</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'right', paddingRight: '8px' }}>Date:</td>
                    <td>{today}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
