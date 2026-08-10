# Compliance Report - internship-platform


Generated: 2026-06-30T10:49:38.698Z


## Executive Summary

Overall compliance score: **0%** (Grade: **F**)

| Framework | Grade | Score | Controls | Passed | Failed | Warnings | Critical Failures |
|-----------|-------|-------|----------|--------|--------|----------|-------------------|
| GDPR | F | 14% | 34 | 4 | 2 | 1 | 2 |
| OWASP | F | 33% | 6 | 2 | 2 | 0 | 2 |
| CIS | F | 0% | 5 | 0 | 0 | 0 | 0 |
| NIST | F | 0% | 23 | 0 | 0 | 0 | 0 |
| NIST-800-53 | F | 13% | 76 | 8 | 0 | 0 | 0 |
| ISO27001 | C | 67% | 10 | 7 | 0 | 0 | 0 |
| ISO27701 | F | 0% | 11 | 0 | 0 | 0 | 0 |
| PRIVACY-CORE | F | 0% | 40 | 0 | 0 | 0 | 0 |
| UK-GDPR | F | 0% | 14 | 0 | 0 | 0 | 0 |
| FADP | F | 0% | 8 | 0 | 0 | 0 | 0 |
| PDPA-SG | F | 0% | 12 | 0 | 0 | 0 | 0 |
| DPA-PH | F | 0% | 10 | 0 | 0 | 0 | 0 |
| APPI | F | 0% | 10 | 0 | 0 | 0 | 0 |
| PIPA | F | 0% | 10 | 0 | 0 | 0 | 0 |
| PIPL | F | 0% | 11 | 0 | 0 | 0 | 0 |
| DPDPA | F | 0% | 8 | 0 | 0 | 0 | 0 |
| LGPD | F | 0% | 10 | 0 | 0 | 0 | 0 |
| PIPEDA | F | 0% | 10 | 0 | 0 | 0 | 0 |
| CPRA | F | 0% | 9 | 0 | 0 | 0 | 0 |
| POPIA | F | 0% | 8 | 0 | 0 | 0 | 0 |
| PDPL-UAE | F | 0% | 6 | 0 | 0 | 0 | 0 |
| PDPL-SA | F | 0% | 6 | 0 | 0 | 0 | 0 |

**Security Findings**: 75 total (58 critical, 6 high)

**Audit Impact**: -100% (58 critical, 6 high, 11 medium, 0 low findings)

## Security Findings

Total findings: **75**

### Secrets

| Severity | Title | File | Fix |
|----------|-------|------|-----|
| critical | Database connection string with credentials | backend/.env.production.example:52 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Database connection string with credentials | backend/.env.production.example:53 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Hardcoded password | backend/src/routes/README.md:156 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Hardcoded secret/token | backend/tests/internships.test.ts:52 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Hardcoded password | backend/tests/unit/middleware/validation.test.ts:29 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Hardcoded password | backend/tests/unit/middleware/validation.test.ts:38 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Hardcoded password | backend/tests/unit/middleware/validation.test.ts:51 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Hardcoded password | backend/tests/unit/middleware/validation.test.ts:75 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Hardcoded secret/token | backend/tests/unit/services/authService.test.ts:19 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Hardcoded password | backend/tests/unit/services/authService.test.ts:48 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Hardcoded password | backend/tests/unit/services/authService.test.ts:61 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Hardcoded password | backend/tests/unit/services/authService.test.ts:89 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Hardcoded password | backend/tests/unit/services/authService.test.ts:117 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Hardcoded password | backend/tests/unit/services/authService.test.ts:127 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Database connection string with credentials | docker-compose.yml:26 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Database connection string with credentials | docker-compose.yml:43 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Database connection string with credentials | docs/admin-docs/documents-page/DOCUMENT_SERVICE_INTEGRATION_PLAN.md:134 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Database connection string with credentials | docs/admin-docs/documents-page/DOCUMENT_SERVICE_INTEGRATION_PLAN.md:164 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Hardcoded secret/token | docs/admin-docs/internships-page/COMPLETE_IMPLEMENTATION_SUMMARY.md:428 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Hardcoded secret/token | docs/admin-docs/internships-page/COMPLETE_IMPLEMENTATION_SUMMARY.md:521 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Hardcoded secret/token | docs/admin-docs/internships-page/QUICK_SETUP_ENHANCED_INTERNSHIPS.md:194 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Hardcoded secret/token | docs/admin-docs/internships-page/TESTING_GUIDE_ENHANCED_INTERNSHIPS.md:92 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Hardcoded secret/token | docs/ai-service-integration-docs/AI_INTEGRATION_QUICK_REF.md:85 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Hardcoded secret/token | docs/ai-service-integration-docs/AI_SERVICE_INTEGRATION_README.md:228 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Database connection string with credentials | docs/deployment/ENV_VARIABLES_QUICK_REF.md:16 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Database connection string with credentials | docs/deployment/PRODUCTION_ENV_SETUP.md:45 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Database connection string with credentials | docs/deployment/PRODUCTION_ENV_SETUP.md:114 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Hardcoded secret/token | docs/deployment/SECURITY_PRE_DEPLOYMENT_CHECKLIST.md:164 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Database connection string with credentials | docs/development/SERVICE_STARTUP_GUIDE.md:93 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Database connection string with credentials | docs/development/SERVICE_STARTUP_GUIDE.md:167 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Database connection string with credentials | docs/development/SERVICE_STARTUP_GUIDE.md:354 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Database connection string with credentials | docs/development/SERVICE_STARTUP_GUIDE.md:367 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Database connection string with credentials | document-service/.env.production.example:61 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Database connection string with credentials | document-service/.env.production.example:62 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Database connection string with credentials | document-service/src/config/env.ts:26 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Hardcoded secret/token | document-service/tests/setup.ts:4 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Hardcoded password | frontend/src/components/shared/SettingsPage.tsx:313 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Hardcoded secret/token | frontend/src/lib/api/admin-companies.ts:99 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Hardcoded secret/token | frontend/src/lib/api/admin-evaluations.ts:16 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Hardcoded secret/token | frontend/src/lib/api/admin-internships-enhanced.ts:40 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Hardcoded secret/token | frontend/src/lib/api/admin-internships.ts:134 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Hardcoded secret/token | frontend/src/lib/api/admin-rubrics.ts:21 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Hardcoded secret/token | frontend/src/lib/api/client.ts:64 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Database connection string with credentials | README.md:195 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Database connection string with credentials | README.md:215 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Database connection string with credentials | README.md:538 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |
| critical | Database connection string with credentials | README.md:550 | Move this secret to a secure vault (Vault, AWS KMS, etc.) or... |

### Injection

| Severity | Title | File | Fix |
|----------|-------|------|-----|
| critical | Code injection risk | backend/src/controllers/admin/companiesController.ts:15 | Remove eval/exec usage with user input. Use safe alternative... |
| critical | Code injection risk | backend/src/controllers/admin/companiesController.ts:16 | Remove eval/exec usage with user input. Use safe alternative... |
| critical | Code injection risk | backend/src/controllers/admin/reportsController.ts:22 | Remove eval/exec usage with user input. Use safe alternative... |
| critical | Code injection risk | backend/src/controllers/admin/reportsController.ts:23 | Remove eval/exec usage with user input. Use safe alternative... |
| critical | Code injection risk | backend/src/controllers/admin/reportsController.ts:34 | Remove eval/exec usage with user input. Use safe alternative... |
| critical | Code injection risk | backend/src/controllers/admin/reportsController.ts:90 | Remove eval/exec usage with user input. Use safe alternative... |
| critical | Code injection risk | backend/src/controllers/admin/reportsController.ts:91 | Remove eval/exec usage with user input. Use safe alternative... |
| critical | Code injection risk | backend/src/controllers/admin/reportsController.ts:102 | Remove eval/exec usage with user input. Use safe alternative... |
| critical | Code injection risk | backend/src/controllers/student/studentController.ts:293 | Remove eval/exec usage with user input. Use safe alternative... |
| critical | Code injection risk | backend/src/controllers/student/studentController.ts:294 | Remove eval/exec usage with user input. Use safe alternative... |
| critical | Code injection risk | backend/src/routes/admin/documents.ts:174 | Remove eval/exec usage with user input. Use safe alternative... |

### Database

| Severity | Title | File | Fix |
|----------|-------|------|-----|
| high | Missing audit timestamps in schema | backend/src/models/document.ts | Add created_at and updated_at columns. In Prisma: add DateTi... |
| medium | Missing user audit columns | backend/src/models/document.ts | Add created_by and updated_by columns to track which user ma... |
| high | Missing audit timestamps in schema | docs/database-migrations/003_add_file_versioning.sql | Add created_at and updated_at columns. In Prisma: add DateTi... |
| medium | Missing soft delete pattern | docs/database-migrations/003_add_file_versioning.sql | Add deleted_at column or soft delete flag. In Prisma: Delete... |
| medium | Missing user audit columns | docs/database-migrations/003_add_file_versioning.sql | Add created_by and updated_by columns to track which user ma... |
| high | Missing audit timestamps in schema | docs/database-migrations/003_ai_service_v2_trend_analysis.sql | Add created_at and updated_at columns. In Prisma: add DateTi... |
| medium | Missing soft delete pattern | docs/database-migrations/003_ai_service_v2_trend_analysis.sql | Add deleted_at column or soft delete flag. In Prisma: Delete... |
| medium | Missing user audit columns | docs/database-migrations/003_ai_service_v2_trend_analysis.sql | Add created_by and updated_by columns to track which user ma... |
| high | Missing audit timestamps in schema | docs/database-migrations/009_weekly_to_daily_reports.sql | Add created_at and updated_at columns. In Prisma: add DateTi... |
| medium | Missing soft delete pattern | docs/database-migrations/009_weekly_to_daily_reports.sql | Add deleted_at column or soft delete flag. In Prisma: Delete... |
| medium | Missing user audit columns | docs/database-migrations/009_weekly_to_daily_reports.sql | Add created_by and updated_by columns to track which user ma... |
| high | Missing audit timestamps in schema | docs/database-migrations/010_student_tasks.sql | Add created_at and updated_at columns. In Prisma: add DateTi... |
| medium | Missing soft delete pattern | docs/database-migrations/010_student_tasks.sql | Add deleted_at column or soft delete flag. In Prisma: Delete... |
| medium | Missing user audit columns | docs/database-migrations/010_student_tasks.sql | Add created_by and updated_by columns to track which user ma... |
| high | Missing audit timestamps in schema | docs/database-migrations/011_weekly_dtr_submissions.sql | Add created_at and updated_at columns. In Prisma: add DateTi... |
| medium | Missing soft delete pattern | docs/database-migrations/011_weekly_dtr_submissions.sql | Add deleted_at column or soft delete flag. In Prisma: Delete... |
| medium | Missing user audit columns | docs/database-migrations/011_weekly_dtr_submissions.sql | Add created_by and updated_by columns to track which user ma... |

## Compliance Details

### Framework Scores

#### GDPR - 14% (Grade: F)

- Total Controls: 34
- Passed: 4
- Failed: 2
- Warnings: 1
- Not Applicable: 0
- Not Implemented: 27
- Critical Failures: 2

**Severity Breakdown:**
| Level | Total | Passed | Failed | Warning | Not Implemented |
|-------|-------|--------|--------|---------|-----------------|
| Critical | 21 | 3 | 2 | 0 | 16 |
| High | 11 | 1 | 0 | 1 | 9 |
| Medium | 2 | 0 | 0 | 0 | 2 |

#### OWASP - 33% (Grade: F)

- Total Controls: 6
- Passed: 2
- Failed: 2
- Warnings: 0
- Not Applicable: 0
- Not Implemented: 2
- Critical Failures: 2

**Severity Breakdown:**
| Level | Total | Passed | Failed | Warning | Not Implemented |
|-------|-------|--------|--------|---------|-----------------|
| Critical | 6 | 2 | 2 | 0 | 2 |

#### CIS - 0% (Grade: F)

- Total Controls: 5
- Passed: 0
- Failed: 0
- Warnings: 0
- Not Applicable: 0
- Not Implemented: 5
- Critical Failures: 0

**Severity Breakdown:**
| Level | Total | Passed | Failed | Warning | Not Implemented |
|-------|-------|--------|--------|---------|-----------------|
| Critical | 3 | 0 | 0 | 0 | 3 |
| High | 2 | 0 | 0 | 0 | 2 |

#### NIST - 0% (Grade: F)

- Total Controls: 23
- Passed: 0
- Failed: 0
- Warnings: 0
- Not Applicable: 0
- Not Implemented: 23
- Critical Failures: 0

**Severity Breakdown:**
| Level | Total | Passed | Failed | Warning | Not Implemented |
|-------|-------|--------|--------|---------|-----------------|
| Critical | 8 | 0 | 0 | 0 | 8 |
| High | 8 | 0 | 0 | 0 | 8 |
| Medium | 7 | 0 | 0 | 0 | 7 |

#### NIST-800-53 - 13% (Grade: F)

- Total Controls: 76
- Passed: 8
- Failed: 0
- Warnings: 0
- Not Applicable: 0
- Not Implemented: 68
- Critical Failures: 0

**Severity Breakdown:**
| Level | Total | Passed | Failed | Warning | Not Implemented |
|-------|-------|--------|--------|---------|-----------------|
| Critical | 16 | 4 | 0 | 0 | 12 |
| High | 37 | 3 | 0 | 0 | 34 |
| Medium | 21 | 1 | 0 | 0 | 20 |
| Low | 2 | 0 | 0 | 0 | 2 |

#### ISO27001 - 67% (Grade: C)

- Total Controls: 10
- Passed: 7
- Failed: 0
- Warnings: 0
- Not Applicable: 0
- Not Implemented: 3
- Critical Failures: 0

**Severity Breakdown:**
| Level | Total | Passed | Failed | Warning | Not Implemented |
|-------|-------|--------|--------|---------|-----------------|
| Critical | 4 | 2 | 0 | 0 | 2 |
| High | 6 | 5 | 0 | 0 | 1 |

#### ISO27701 - 0% (Grade: F)

- Total Controls: 11
- Passed: 0
- Failed: 0
- Warnings: 0
- Not Applicable: 0
- Not Implemented: 11
- Critical Failures: 0

**Severity Breakdown:**
| Level | Total | Passed | Failed | Warning | Not Implemented |
|-------|-------|--------|--------|---------|-----------------|
| Critical | 5 | 0 | 0 | 0 | 5 |
| High | 6 | 0 | 0 | 0 | 6 |

#### PRIVACY-CORE - 0% (Grade: F)

- Total Controls: 40
- Passed: 0
- Failed: 0
- Warnings: 0
- Not Applicable: 0
- Not Implemented: 40
- Critical Failures: 0

**Severity Breakdown:**
| Level | Total | Passed | Failed | Warning | Not Implemented |
|-------|-------|--------|--------|---------|-----------------|
| Critical | 13 | 0 | 0 | 0 | 13 |
| High | 20 | 0 | 0 | 0 | 20 |
| Medium | 6 | 0 | 0 | 0 | 6 |
| Low | 1 | 0 | 0 | 0 | 1 |

#### UK-GDPR - 0% (Grade: F)

- Total Controls: 14
- Passed: 0
- Failed: 0
- Warnings: 0
- Not Applicable: 0
- Not Implemented: 14
- Critical Failures: 0

**Severity Breakdown:**
| Level | Total | Passed | Failed | Warning | Not Implemented |
|-------|-------|--------|--------|---------|-----------------|
| Critical | 7 | 0 | 0 | 0 | 7 |
| High | 6 | 0 | 0 | 0 | 6 |
| Medium | 1 | 0 | 0 | 0 | 1 |

#### FADP - 0% (Grade: F)

- Total Controls: 8
- Passed: 0
- Failed: 0
- Warnings: 0
- Not Applicable: 0
- Not Implemented: 8
- Critical Failures: 0

**Severity Breakdown:**
| Level | Total | Passed | Failed | Warning | Not Implemented |
|-------|-------|--------|--------|---------|-----------------|
| Critical | 2 | 0 | 0 | 0 | 2 |
| High | 5 | 0 | 0 | 0 | 5 |
| Medium | 1 | 0 | 0 | 0 | 1 |

#### PDPA-SG - 0% (Grade: F)

- Total Controls: 12
- Passed: 0
- Failed: 0
- Warnings: 0
- Not Applicable: 0
- Not Implemented: 12
- Critical Failures: 0

**Severity Breakdown:**
| Level | Total | Passed | Failed | Warning | Not Implemented |
|-------|-------|--------|--------|---------|-----------------|
| Critical | 4 | 0 | 0 | 0 | 4 |
| High | 5 | 0 | 0 | 0 | 5 |
| Medium | 3 | 0 | 0 | 0 | 3 |

#### DPA-PH - 0% (Grade: F)

- Total Controls: 10
- Passed: 0
- Failed: 0
- Warnings: 0
- Not Applicable: 0
- Not Implemented: 10
- Critical Failures: 0

**Severity Breakdown:**
| Level | Total | Passed | Failed | Warning | Not Implemented |
|-------|-------|--------|--------|---------|-----------------|
| Critical | 4 | 0 | 0 | 0 | 4 |
| High | 6 | 0 | 0 | 0 | 6 |

#### APPI - 0% (Grade: F)

- Total Controls: 10
- Passed: 0
- Failed: 0
- Warnings: 0
- Not Applicable: 0
- Not Implemented: 10
- Critical Failures: 0

**Severity Breakdown:**
| Level | Total | Passed | Failed | Warning | Not Implemented |
|-------|-------|--------|--------|---------|-----------------|
| Critical | 4 | 0 | 0 | 0 | 4 |
| High | 5 | 0 | 0 | 0 | 5 |
| Medium | 1 | 0 | 0 | 0 | 1 |

#### PIPA - 0% (Grade: F)

- Total Controls: 10
- Passed: 0
- Failed: 0
- Warnings: 0
- Not Applicable: 0
- Not Implemented: 10
- Critical Failures: 0

**Severity Breakdown:**
| Level | Total | Passed | Failed | Warning | Not Implemented |
|-------|-------|--------|--------|---------|-----------------|
| Critical | 5 | 0 | 0 | 0 | 5 |
| High | 5 | 0 | 0 | 0 | 5 |

#### PIPL - 0% (Grade: F)

- Total Controls: 11
- Passed: 0
- Failed: 0
- Warnings: 0
- Not Applicable: 0
- Not Implemented: 11
- Critical Failures: 0

**Severity Breakdown:**
| Level | Total | Passed | Failed | Warning | Not Implemented |
|-------|-------|--------|--------|---------|-----------------|
| Critical | 6 | 0 | 0 | 0 | 6 |
| High | 4 | 0 | 0 | 0 | 4 |
| Medium | 1 | 0 | 0 | 0 | 1 |

#### DPDPA - 0% (Grade: F)

- Total Controls: 8
- Passed: 0
- Failed: 0
- Warnings: 0
- Not Applicable: 0
- Not Implemented: 8
- Critical Failures: 0

**Severity Breakdown:**
| Level | Total | Passed | Failed | Warning | Not Implemented |
|-------|-------|--------|--------|---------|-----------------|
| Critical | 2 | 0 | 0 | 0 | 2 |
| High | 5 | 0 | 0 | 0 | 5 |
| Medium | 1 | 0 | 0 | 0 | 1 |

#### LGPD - 0% (Grade: F)

- Total Controls: 10
- Passed: 0
- Failed: 0
- Warnings: 0
- Not Applicable: 0
- Not Implemented: 10
- Critical Failures: 0

**Severity Breakdown:**
| Level | Total | Passed | Failed | Warning | Not Implemented |
|-------|-------|--------|--------|---------|-----------------|
| Critical | 7 | 0 | 0 | 0 | 7 |
| High | 3 | 0 | 0 | 0 | 3 |

#### PIPEDA - 0% (Grade: F)

- Total Controls: 10
- Passed: 0
- Failed: 0
- Warnings: 0
- Not Applicable: 0
- Not Implemented: 10
- Critical Failures: 0

**Severity Breakdown:**
| Level | Total | Passed | Failed | Warning | Not Implemented |
|-------|-------|--------|--------|---------|-----------------|
| Critical | 4 | 0 | 0 | 0 | 4 |
| High | 4 | 0 | 0 | 0 | 4 |
| Medium | 2 | 0 | 0 | 0 | 2 |

#### CPRA - 0% (Grade: F)

- Total Controls: 9
- Passed: 0
- Failed: 0
- Warnings: 0
- Not Applicable: 0
- Not Implemented: 9
- Critical Failures: 0

**Severity Breakdown:**
| Level | Total | Passed | Failed | Warning | Not Implemented |
|-------|-------|--------|--------|---------|-----------------|
| Critical | 2 | 0 | 0 | 0 | 2 |
| High | 6 | 0 | 0 | 0 | 6 |
| Medium | 1 | 0 | 0 | 0 | 1 |

#### POPIA - 0% (Grade: F)

- Total Controls: 8
- Passed: 0
- Failed: 0
- Warnings: 0
- Not Applicable: 0
- Not Implemented: 8
- Critical Failures: 0

**Severity Breakdown:**
| Level | Total | Passed | Failed | Warning | Not Implemented |
|-------|-------|--------|--------|---------|-----------------|
| Critical | 4 | 0 | 0 | 0 | 4 |
| High | 2 | 0 | 0 | 0 | 2 |
| Medium | 2 | 0 | 0 | 0 | 2 |

#### PDPL-UAE - 0% (Grade: F)

- Total Controls: 6
- Passed: 0
- Failed: 0
- Warnings: 0
- Not Applicable: 0
- Not Implemented: 6
- Critical Failures: 0

**Severity Breakdown:**
| Level | Total | Passed | Failed | Warning | Not Implemented |
|-------|-------|--------|--------|---------|-----------------|
| Critical | 3 | 0 | 0 | 0 | 3 |
| High | 3 | 0 | 0 | 0 | 3 |

#### PDPL-SA - 0% (Grade: F)

- Total Controls: 6
- Passed: 0
- Failed: 0
- Warnings: 0
- Not Applicable: 0
- Not Implemented: 6
- Critical Failures: 0

**Severity Breakdown:**
| Level | Total | Passed | Failed | Warning | Not Implemented |
|-------|-------|--------|--------|---------|-----------------|
| Critical | 3 | 0 | 0 | 0 | 3 |
| High | 3 | 0 | 0 | 0 | 3 |


## Risk Assessment

**Critical Issues**: 0
**High Issues**: 0
**Total Failed Controls**: 0
**Critical Findings**: 58


## Security Controls

| ID | Name | Status | Severity |
|----|------|--------|----------|
| GDPR-ART32-002 | Encryption at Rest | not-implemented | critical |
| GDPR-ART32-003 | Encryption in Transit | not-implemented | critical |
| GDPR-ART32-004 | Unique User Identification | not-implemented | critical |
| GDPR-ART32-005 | Automatic Session Timeout | not-implemented | high |
| GDPR-ART32-006 | Audit Logging | not-implemented | critical |
| GDPR-ART32-009 | Regular Security Testing | not-implemented | critical |
| OWASP-ASVS-003 | Authentication Security | not-implemented | critical |
| OWASP-ASVS-004 | Access Control | not-implemented | critical |
| OWASP-ASVS-005 | Secrets Management | not-implemented | critical |
| OWASP-ASVS-006 | Secure Communications | not-implemented | critical |
| NIST-800-53-AU-2 | Event Logging | not-implemented | critical |
| NIST-800-53-AU-3 | Content of Audit Records | not-implemented | high |
| NIST-800-53-AU-6 | Audit Record Review, Analysis, and Reporting | not-implemented | high |
| NIST-800-53-AU-9 | Protection of Audit Information | not-implemented | high |
| NIST-800-53-AU-12 | Audit Record Generation | not-implemented | critical |
| NIST-800-53-IA-2 | Identification and Authentication | not-implemented | critical |
| NIST-800-53-IA-5 | Authenticator Management | not-implemented | critical |
| NIST-800-53-IA-8 | Service Provider Identification and Authentication | not-implemented | medium |
| ISO27001-A9 | Access Control | not-implemented | critical |
| ISO27001-A10 | Cryptography | not-implemented | critical |
| ISO27001-A18 | Compliance | not-implemented | high |
| HIPAA-164.312-a | Access Control | not-implemented | critical |
| HIPAA-164.312-b | Audit Controls | not-implemented | critical |
| HIPAA-164.312-d | Person or Entity Authentication | not-implemented | critical |
| HIPAA-164.312-e | Transmission Security | not-implemented | critical |

### Security Findings (75)

- [CRITICAL] Database connection string with credentials (backend/.env.production.example)
- [CRITICAL] Database connection string with credentials (backend/.env.production.example)
- [CRITICAL] Hardcoded password (backend/src/routes/README.md)
- [CRITICAL] Hardcoded secret/token (backend/tests/internships.test.ts)
- [CRITICAL] Hardcoded password (backend/tests/unit/middleware/validation.test.ts)
- [CRITICAL] Hardcoded password (backend/tests/unit/middleware/validation.test.ts)
- [CRITICAL] Hardcoded password (backend/tests/unit/middleware/validation.test.ts)
- [CRITICAL] Hardcoded password (backend/tests/unit/middleware/validation.test.ts)
- [CRITICAL] Hardcoded secret/token (backend/tests/unit/services/authService.test.ts)
- [CRITICAL] Hardcoded password (backend/tests/unit/services/authService.test.ts)
- [CRITICAL] Hardcoded password (backend/tests/unit/services/authService.test.ts)
- [CRITICAL] Hardcoded password (backend/tests/unit/services/authService.test.ts)
- [CRITICAL] Hardcoded password (backend/tests/unit/services/authService.test.ts)
- [CRITICAL] Hardcoded password (backend/tests/unit/services/authService.test.ts)
- [CRITICAL] Database connection string with credentials (docker-compose.yml)
- [CRITICAL] Database connection string with credentials (docker-compose.yml)
- [CRITICAL] Database connection string with credentials (docs/admin-docs/documents-page/DOCUMENT_SERVICE_INTEGRATION_PLAN.md)
- [CRITICAL] Database connection string with credentials (docs/admin-docs/documents-page/DOCUMENT_SERVICE_INTEGRATION_PLAN.md)
- [CRITICAL] Hardcoded secret/token (docs/admin-docs/internships-page/COMPLETE_IMPLEMENTATION_SUMMARY.md)
- [CRITICAL] Hardcoded secret/token (docs/admin-docs/internships-page/COMPLETE_IMPLEMENTATION_SUMMARY.md)

## Compliance Recommendations

### Immediate Security Fixes

- **[CRITICAL] Database connection string with credentials** (backend/.env.production.example): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Database connection string with credentials** (backend/.env.production.example): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Hardcoded password** (backend/src/routes/README.md): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Hardcoded secret/token** (backend/tests/internships.test.ts): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Hardcoded password** (backend/tests/unit/middleware/validation.test.ts): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Hardcoded password** (backend/tests/unit/middleware/validation.test.ts): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Hardcoded password** (backend/tests/unit/middleware/validation.test.ts): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Hardcoded password** (backend/tests/unit/middleware/validation.test.ts): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Hardcoded secret/token** (backend/tests/unit/services/authService.test.ts): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Hardcoded password** (backend/tests/unit/services/authService.test.ts): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Hardcoded password** (backend/tests/unit/services/authService.test.ts): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Hardcoded password** (backend/tests/unit/services/authService.test.ts): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Hardcoded password** (backend/tests/unit/services/authService.test.ts): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Hardcoded password** (backend/tests/unit/services/authService.test.ts): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Database connection string with credentials** (docker-compose.yml): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Database connection string with credentials** (docker-compose.yml): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Database connection string with credentials** (docs/admin-docs/documents-page/DOCUMENT_SERVICE_INTEGRATION_PLAN.md): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Database connection string with credentials** (docs/admin-docs/documents-page/DOCUMENT_SERVICE_INTEGRATION_PLAN.md): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Hardcoded secret/token** (docs/admin-docs/internships-page/COMPLETE_IMPLEMENTATION_SUMMARY.md): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Hardcoded secret/token** (docs/admin-docs/internships-page/COMPLETE_IMPLEMENTATION_SUMMARY.md): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Hardcoded secret/token** (docs/admin-docs/internships-page/QUICK_SETUP_ENHANCED_INTERNSHIPS.md): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Hardcoded secret/token** (docs/admin-docs/internships-page/TESTING_GUIDE_ENHANCED_INTERNSHIPS.md): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Hardcoded secret/token** (docs/ai-service-integration-docs/AI_INTEGRATION_QUICK_REF.md): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Hardcoded secret/token** (docs/ai-service-integration-docs/AI_SERVICE_INTEGRATION_README.md): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Database connection string with credentials** (docs/deployment/ENV_VARIABLES_QUICK_REF.md): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Database connection string with credentials** (docs/deployment/PRODUCTION_ENV_SETUP.md): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Database connection string with credentials** (docs/deployment/PRODUCTION_ENV_SETUP.md): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Hardcoded secret/token** (docs/deployment/SECURITY_PRE_DEPLOYMENT_CHECKLIST.md): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Database connection string with credentials** (docs/development/SERVICE_STARTUP_GUIDE.md): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Database connection string with credentials** (docs/development/SERVICE_STARTUP_GUIDE.md): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Database connection string with credentials** (docs/development/SERVICE_STARTUP_GUIDE.md): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Database connection string with credentials** (docs/development/SERVICE_STARTUP_GUIDE.md): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Database connection string with credentials** (document-service/.env.production.example): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Database connection string with credentials** (document-service/.env.production.example): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Database connection string with credentials** (document-service/src/config/env.ts): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Hardcoded secret/token** (document-service/tests/setup.ts): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Hardcoded password** (frontend/src/components/shared/SettingsPage.tsx): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Hardcoded secret/token** (frontend/src/lib/api/admin-companies.ts): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Hardcoded secret/token** (frontend/src/lib/api/admin-evaluations.ts): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Hardcoded secret/token** (frontend/src/lib/api/admin-internships-enhanced.ts): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Hardcoded secret/token** (frontend/src/lib/api/admin-internships.ts): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Hardcoded secret/token** (frontend/src/lib/api/admin-rubrics.ts): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Hardcoded secret/token** (frontend/src/lib/api/client.ts): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Database connection string with credentials** (README.md): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Database connection string with credentials** (README.md): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Database connection string with credentials** (README.md): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Database connection string with credentials** (README.md): Move this secret to a secure vault (Vault, AWS KMS, etc.) or environment variable. Never commit secrets to source control.
- **[CRITICAL] Code injection risk** (backend/src/controllers/admin/companiesController.ts): Remove eval/exec usage with user input. Use safe alternatives.
- **[CRITICAL] Code injection risk** (backend/src/controllers/admin/companiesController.ts): Remove eval/exec usage with user input. Use safe alternatives.
- **[CRITICAL] Code injection risk** (backend/src/controllers/admin/reportsController.ts): Remove eval/exec usage with user input. Use safe alternatives.
- **[CRITICAL] Code injection risk** (backend/src/controllers/admin/reportsController.ts): Remove eval/exec usage with user input. Use safe alternatives.
- **[CRITICAL] Code injection risk** (backend/src/controllers/admin/reportsController.ts): Remove eval/exec usage with user input. Use safe alternatives.
- **[CRITICAL] Code injection risk** (backend/src/controllers/admin/reportsController.ts): Remove eval/exec usage with user input. Use safe alternatives.
- **[CRITICAL] Code injection risk** (backend/src/controllers/admin/reportsController.ts): Remove eval/exec usage with user input. Use safe alternatives.
- **[CRITICAL] Code injection risk** (backend/src/controllers/admin/reportsController.ts): Remove eval/exec usage with user input. Use safe alternatives.
- **[CRITICAL] Code injection risk** (backend/src/controllers/student/studentController.ts): Remove eval/exec usage with user input. Use safe alternatives.
- **[CRITICAL] Code injection risk** (backend/src/controllers/student/studentController.ts): Remove eval/exec usage with user input. Use safe alternatives.
- **[CRITICAL] Code injection risk** (backend/src/routes/admin/documents.ts): Remove eval/exec usage with user input. Use safe alternatives.

### Not Yet Implemented

364 controls have not been implemented yet. Start with:

- **GDPR-ART5-001** (critical): Lawfulness, Fairness, and Transparency
- **GDPR-ART5-002** (critical): Purpose Limitation
- **GDPR-ART5-003** (high): Data Minimisation
- **GDPR-ART5-004** (high): Accuracy
- **GDPR-ART5-005** (critical): Storage Limitation
- ... and 359 more

**Compliance posture is critically low.** Resolve all critical findings before any deployment.