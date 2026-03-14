/**
 * Unit Test: Final Evaluation Visibility Logic
 * 
 * Tests the gating conditions for student final evaluation visibility:
 * 1. Final evaluation must exist
 * 2. Final evaluation must have status 'approved'
 * 3. Internship must have ended (today >= end_date)
 */

interface FinalEvaluation {
  id: string;
  evaluation_type?: string;
  status: string;
}

interface Internship {
  end_date: string;
}

/**
 * Determines if final evaluation should be visible to student
 */
export function isFinalEvaluationAvailable(
  evaluations: FinalEvaluation[],
  internship: Internship | null
): { available: boolean; reason?: string } {
  // Check if final evaluation exists
  const finalEval = evaluations.find(e => (e.evaluation_type || 'final') === 'final');
  
  if (!finalEval) {
    return { available: false, reason: 'No final evaluation submitted yet' };
  }

  // Check if final evaluation is approved
  if (finalEval.status !== 'approved') {
    return { available: false, reason: 'Final evaluation pending approval' };
  }

  // Check if internship has ended
  if (!internship?.end_date) {
    return { available: false, reason: 'Internship end date not set' };
  }

  const today = new Date();
  const endDate = new Date(internship.end_date);
  const internshipEnded = today >= endDate;

  if (!internshipEnded) {
    return { 
      available: false, 
      reason: `Final evaluation will unlock after ${endDate.toLocaleDateString()}` 
    };
  }

  // All conditions met
  return { available: true };
}

// ========== TESTS ==========

function runTests() {
  console.log('\n🧪 Running Final Evaluation Visibility Tests...\n');

  const testCases = [
    {
      name: 'No final evaluation exists',
      evaluations: [],
      internship: { end_date: '2025-12-01' },
      expected: { available: false, reason: 'No final evaluation submitted yet' },
    },
    {
      name: 'Final evaluation not approved',
      evaluations: [{ id: '1', evaluation_type: 'final', status: 'submitted' }],
      internship: { end_date: '2025-12-01' },
      expected: { available: false, reason: 'Final evaluation pending approval' },
    },
    {
      name: 'Internship not ended yet',
      evaluations: [{ id: '1', evaluation_type: 'final', status: 'approved' }],
      internship: { end_date: '2026-12-01' }, // Future date
      expected: { available: false },
    },
    {
      name: 'All conditions met - evaluation visible',
      evaluations: [{ id: '1', evaluation_type: 'final', status: 'approved' }],
      internship: { end_date: '2025-12-01' }, // Past date
      expected: { available: true },
    },
    {
      name: 'Evaluation type defaults to final if missing',
      evaluations: [{ id: '1', status: 'approved' }],
      internship: { end_date: '2025-12-01' },
      expected: { available: true },
    },
  ];

  let passed = 0;
  let failed = 0;

  testCases.forEach(({ name, evaluations, internship, expected }) => {
    const result = isFinalEvaluationAvailable(evaluations, internship);
    const success = result.available === expected.available;
    
    if (success) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${name}`);
      console.log(`   Expected: ${JSON.stringify(expected)}`);
      console.log(`   Got:      ${JSON.stringify(result)}`);
      failed++;
    }
  });

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  
  return failed === 0;
}

// Run tests if executed directly
if (require.main === module) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}

export { runTests };
