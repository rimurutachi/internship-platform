/**
 * Enhanced Internship Management API Test Script
 * 
 * This script tests all 14 enhanced endpoints to verify they're working correctly.
 * 
 * Usage:
 *   1. Ensure backend is running: npm run dev
 *   2. Set environment variables or update config below
 *   3. Run: node tests/enhanced-internships-api.test.js
 * 
 * Requirements:
 *   - Backend server running on http://localhost:5000
 *   - Valid admin JWT token
 *   - At least one internship in database for testing
 */

const axios = require('axios');

// Configuration
const config = {
  baseURL: process.env.API_BASE_URL || 'http://localhost:5000',
  adminToken: process.env.ADMIN_JWT_TOKEN || 'YOUR_JWT_TOKEN_HERE', // Replace with actual token
  internshipId: process.env.TEST_INTERNSHIP_ID || null, // Will auto-fetch if not provided
  companyId: process.env.TEST_COMPANY_ID || null,
};

// API Client
const api = axios.create({
  baseURL: `${config.baseURL}/api/admin/internships`,
  headers: {
    'Authorization': `Bearer ${config.adminToken}`,
    'Content-Type': 'application/json',
  },
});

// Test Results Tracker
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: [],
};

// Helper Functions
function logTest(name, status, message = '') {
  const symbol = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
  console.log(`${symbol} ${name} ${message ? `- ${message}` : ''}`);
  results.tests.push({ name, status, message });
  if (status === 'PASS') results.passed++;
  else if (status === 'FAIL') results.failed++;
  else results.skipped++;
}

function logSection(title) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'='.repeat(60)}\n`);
}

// Test Suite
async function runTests() {
  console.log('🚀 Enhanced Internship Management API Tests\n');

  try {
    // Setup: Get test internship if not provided
    if (!config.internshipId) {
      await setupTestData();
    }

    // Run all test suites
    await testReminderEndpoints();
    await testCapacityEndpoints();
    await testDocumentEndpoints();
    await testBulkOperations();
    await testAnalytics();

    // Print Summary
    printSummary();
  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

async function setupTestData() {
  logSection('SETUP: Fetching Test Data');

  try {
    // Get first internship for testing
    const response = await api.get('/');
    if (response.data.data.internships.length > 0) {
      config.internshipId = response.data.data.internships[0].id;
      config.companyId = response.data.data.internships[0].company_id;
      logTest('Fetch test internship', 'PASS', `Using internship ID: ${config.internshipId}`);
    } else {
      logTest('Fetch test internship', 'FAIL', 'No internships found in database');
      throw new Error('No internships available for testing. Please create one first.');
    }
  } catch (error) {
    logTest('Fetch test internship', 'FAIL', error.message);
    throw error;
  }
}

async function testReminderEndpoints() {
  logSection('TEST SUITE: Reminder Endpoints');

  let createdReminderId = null;

  // Test 1: Get reminders for internship
  try {
    const response = await api.get(`/enhanced/reminders/${config.internshipId}`);
    if (response.status === 200 && Array.isArray(response.data.reminders)) {
      logTest('GET /reminders/:internshipId', 'PASS', `Found ${response.data.reminders.length} reminders`);
    } else {
      logTest('GET /reminders/:internshipId', 'FAIL', 'Invalid response structure');
    }
  } catch (error) {
    logTest('GET /reminders/:internshipId', 'FAIL', error.response?.data?.message || error.message);
  }

  // Test 2: Create reminder
  try {
    const reminderData = {
      internship_id: config.internshipId,
      reminder_type: 'custom',
      scheduled_for: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      notification_channel: 'in_app',
      custom_message: 'Test reminder created by API test script',
    };

    const response = await api.post('/enhanced/reminders', reminderData);
    if (response.status === 201 && response.data.reminder?.id) {
      createdReminderId = response.data.reminder.id;
      logTest('POST /reminders', 'PASS', `Created reminder ID: ${createdReminderId}`);
    } else {
      logTest('POST /reminders', 'FAIL', 'Invalid response structure');
    }
  } catch (error) {
    logTest('POST /reminders', 'FAIL', error.response?.data?.message || error.message);
  }

  // Test 3: Update reminder (only if we created one)
  if (createdReminderId) {
    try {
      const updateData = {
        custom_message: 'Updated test reminder message',
        notification_channel: 'both',
      };

      const response = await api.patch(`/enhanced/reminders/${createdReminderId}`, updateData);
      if (response.status === 200) {
        logTest('PATCH /reminders/:id', 'PASS', 'Updated reminder successfully');
      } else {
        logTest('PATCH /reminders/:id', 'FAIL', 'Invalid response');
      }
    } catch (error) {
      logTest('PATCH /reminders/:id', 'FAIL', error.response?.data?.message || error.message);
    }
  } else {
    logTest('PATCH /reminders/:id', 'SKIP', 'No reminder created to update');
  }

  // Test 4: Send immediate reminder (using created reminder or skip)
  if (createdReminderId) {
    try {
      const response = await api.post(`/enhanced/reminders/${createdReminderId}/send`);
      if (response.status === 200) {
        logTest('POST /reminders/:id/send', 'PASS', 'Sent reminder successfully');
      } else {
        logTest('POST /reminders/:id/send', 'FAIL', 'Invalid response');
      }
    } catch (error) {
      logTest('POST /reminders/:id/send', 'FAIL', error.response?.data?.message || error.message);
    }
  } else {
    logTest('POST /reminders/:id/send', 'SKIP', 'No reminder to send');
  }

  // Test 5: Bulk send reminders
  try {
    const bulkData = {
      internship_ids: [config.internshipId],
      reminder_type: 'custom',
      custom_message: 'Bulk reminder test',
      notification_channel: 'in_app',
    };

    const response = await api.post('/enhanced/reminders/bulk-send', bulkData);
    if (response.status === 200) {
      logTest('POST /reminders/bulk-send', 'PASS', `Sent to ${response.data.sent_count || 0} internships`);
    } else {
      logTest('POST /reminders/bulk-send', 'FAIL', 'Invalid response');
    }
  } catch (error) {
    logTest('POST /reminders/bulk-send', 'FAIL', error.response?.data?.message || error.message);
  }

  // Test 6: Delete reminder (cleanup if we created one)
  if (createdReminderId) {
    try {
      const response = await api.delete(`/enhanced/reminders/${createdReminderId}`);
      if (response.status === 200) {
        logTest('DELETE /reminders/:id', 'PASS', 'Deleted reminder successfully');
      } else {
        logTest('DELETE /reminders/:id', 'FAIL', 'Invalid response');
      }
    } catch (error) {
      logTest('DELETE /reminders/:id', 'FAIL', error.response?.data?.message || error.message);
    }
  } else {
    logTest('DELETE /reminders/:id', 'SKIP', 'No reminder to delete');
  }
}

async function testCapacityEndpoints() {
  logSection('TEST SUITE: Capacity Endpoints');

  // Test 7: Get capacity overview
  try {
    const response = await api.get('/enhanced/capacity/overview');
    if (response.status === 200 && Array.isArray(response.data)) {
      logTest('GET /capacity/overview', 'PASS', `Found ${response.data.length} companies`);
    } else {
      logTest('GET /capacity/overview', 'FAIL', 'Invalid response structure');
    }
  } catch (error) {
    logTest('GET /capacity/overview', 'FAIL', error.response?.data?.message || error.message);
  }

  // Test 8: Validate capacity
  if (config.companyId) {
    try {
      const response = await api.post('/enhanced/capacity/validate', {
        company_id: config.companyId,
      });

      if (response.status === 200 && typeof response.data.is_valid === 'boolean') {
        const status = response.data.is_valid ? 'has capacity' : 'at capacity';
        logTest('POST /capacity/validate', 'PASS', `Company ${status}`);
      } else {
        logTest('POST /capacity/validate', 'FAIL', 'Invalid response structure');
      }
    } catch (error) {
      logTest('POST /capacity/validate', 'FAIL', error.response?.data?.message || error.message);
    }
  } else {
    logTest('POST /capacity/validate', 'SKIP', 'No company ID available');
  }
}

async function testDocumentEndpoints() {
  logSection('TEST SUITE: Document Endpoints');

  // Test 9: Get document status
  try {
    const response = await api.get(`/enhanced/documents/${config.internshipId}`);
    if (response.status === 200 && Array.isArray(response.data.documents)) {
      logTest('GET /documents/:internshipId', 'PASS', `Found ${response.data.documents.length} documents`);
    } else {
      logTest('GET /documents/:internshipId', 'FAIL', 'Invalid response structure');
    }
  } catch (error) {
    logTest('GET /documents/:internshipId', 'FAIL', error.response?.data?.message || error.message);
  }

  // Test 10: Get completion rate
  try {
    const response = await api.get('/enhanced/documents/completion-rate', {
      params: { internship_ids: config.internshipId },
    });

    if (response.status === 200 && typeof response.data.overall_completion === 'number') {
      logTest('GET /documents/completion-rate', 'PASS', `Completion: ${response.data.overall_completion}%`);
    } else {
      logTest('GET /documents/completion-rate', 'FAIL', 'Invalid response structure');
    }
  } catch (error) {
    logTest('GET /documents/completion-rate', 'FAIL', error.response?.data?.message || error.message);
  }
}

async function testBulkOperations() {
  logSection('TEST SUITE: Bulk Operations');

  // Test 11: Bulk update status
  try {
    const response = await api.post('/enhanced/bulk/update-status', {
      internship_ids: [config.internshipId],
      status: 'active',
      notes: 'Bulk update test',
    });

    if (response.status === 200) {
      logTest('POST /bulk/update-status', 'PASS', `Updated ${response.data.updated_count || 0} internships`);
    } else {
      logTest('POST /bulk/update-status', 'FAIL', 'Invalid response');
    }
  } catch (error) {
    logTest('POST /bulk/update-status', 'FAIL', error.response?.data?.message || error.message);
  }

  // Test 12: Bulk export (check response format, don't download full data)
  try {
    const response = await api.post('/enhanced/bulk/export', {
      internship_ids: [config.internshipId],
      format: 'json',
      include_fields: ['student', 'company', 'status'],
    });

    if (response.status === 200 && response.data.export_url) {
      logTest('POST /bulk/export', 'PASS', 'Export URL generated');
    } else if (response.status === 200 && response.data.data) {
      logTest('POST /bulk/export', 'PASS', 'Export data returned');
    } else {
      logTest('POST /bulk/export', 'FAIL', 'Invalid response structure');
    }
  } catch (error) {
    logTest('POST /bulk/export', 'FAIL', error.response?.data?.message || error.message);
  }
}

async function testAnalytics() {
  logSection('TEST SUITE: Analytics');

  // Test 13: Generate report
  try {
    const response = await api.post('/enhanced/analytics/generate-report', {
      internship_ids: [config.internshipId],
      report_type: 'summary',
    });

    if (response.status === 200 && response.data.report) {
      logTest('POST /analytics/generate-report', 'PASS', 'Report generated');
    } else {
      logTest('POST /analytics/generate-report', 'FAIL', 'Invalid response structure');
    }
  } catch (error) {
    logTest('POST /analytics/generate-report', 'FAIL', error.response?.data?.message || error.message);
  }

  // Test 14: Deadline tracking
  try {
    const response = await api.get('/enhanced/analytics/deadline-tracking');

    if (response.status === 200 && Array.isArray(response.data.approaching_deadlines)) {
      logTest('GET /analytics/deadline-tracking', 'PASS', `${response.data.approaching_deadlines.length} approaching deadlines`);
    } else {
      logTest('GET /analytics/deadline-tracking', 'FAIL', 'Invalid response structure');
    }
  } catch (error) {
    logTest('GET /analytics/deadline-tracking', 'FAIL', error.response?.data?.message || error.message);
  }
}

function printSummary() {
  logSection('TEST SUMMARY');

  console.log(`Total Tests: ${results.passed + results.failed + results.skipped}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);

  if (results.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.tests
      .filter(t => t.status === 'FAIL')
      .forEach(t => console.log(`  - ${t.name}: ${t.message}`));
  }

  console.log('\n' + '='.repeat(60));

  if (results.failed === 0) {
    console.log('✅ ALL TESTS PASSED!\n');
    process.exit(0);
  } else {
    console.log(`❌ ${results.failed} TEST(S) FAILED\n`);
    process.exit(1);
  }
}

// Run tests
runTests();
