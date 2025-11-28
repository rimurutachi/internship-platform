# Service Facade Pattern - Usage Guide

## Overview

The platform now uses **Service Facades** to provide a clean, unified API for internship and evaluation operations. This consolidates functionality from multiple service files into single, easy-to-use interfaces.

## Benefits

✅ **Single Import** - One import instead of three  
✅ **Clear API** - All related methods in one place  
✅ **Backward Compatible** - Old services still work  
✅ **Better Documentation** - Organized by feature area  
✅ **Easier Maintenance** - Changes in one place  

---

## Internship Service Facade

### Before (Multiple Imports)
```typescript
import { InternshipService } from '../services/internshipService';
import { InternshipsService } from '../services/internshipsService';
import { InternshipsEnhancedService } from '../services/internshipsEnhancedService';

const crudService = new InternshipService();
const validationService = new InternshipsService();

// Create internship
const internship = await crudService.create(data);

// Validate assignment
const validation = await validationService.validateInternshipAssignment(...);

// Export data
const exportData = await InternshipsEnhancedService.exportInternships(ids, 'csv');
```

### After (Single Import)
```typescript
import { internshipService } from '../services/internship.service';

// All operations through one service
const internship = await internshipService.create(data);
const validation = await internshipService.validateInternshipAssignment(...);
const exportData = await internshipService.exportInternships(ids, 'csv');
```

### Available Methods

**CRUD Operations:**
- `create(data)` - Create new internship
- `getById(id)` - Get internship with relations
- `getAll(filters)` - List internships
- `update(id, updates)` - Update internship
- `delete(id)` - Delete internship
- `getStudentInternships(studentId)` - Student's internships
- `getAdvisorInternships(advisorId)` - Advisor's internships

**Validation:**
- `validateInternshipAssignment()` - Validate constraints
- `validateInternshipUpdate()` - Validate updates
- `buildInternshipsQuery(filters)` - Build query with filters
- `logActivity()` - Log audit trail

**Enhanced Features:**
- `updateCompanyStudentCount()` - Update capacity
- `exportInternships()` - Export to CSV/JSON/Excel
- `getDocumentCompletionRate()` - Document analytics
- `getCompanyCapacityAnalytics()` - Capacity metrics
- `validateCompanyCapacity()` - Check if company can accept students

---

## Evaluation Service Facade

### Before (Multiple Imports)
```typescript
import { EvaluationService } from '../services/evaluationService';
import { EvaluationsService } from '../services/evaluationsService';

const crudService = new EvaluationService();
const analyticsService = new EvaluationsService();

// Create and process
const evaluation = await crudService.create(data);
await crudService.processWithAI(evaluation.id);

// Get metrics
const metrics = await analyticsService.getQualityMetrics();
```

### After (Single Import)
```typescript
import { evaluationService } from '../services/evaluation.service';

// All operations through one service
const evaluation = await evaluationService.create(data);
await evaluationService.processWithAI(evaluation.id);
const metrics = await evaluationService.getQualityMetrics();
```

### Available Methods

**CRUD & AI:**
- `create(data)` - Create new evaluation
- `getById(id)` - Get evaluation with relations
- `processWithAI(evaluationId)` - AI analysis
- `submit(evaluationId)` - Submit for review
- `approve(evaluationId, grade)` - Approve evaluation
- `getByInternship(internshipId)` - Get all for internship

**Analytics:**
- `calculateAverageRating(evaluation)` - Calculate average
- `formatAIResults(evaluation)` - Format AI results
- `isReadyForApproval(evaluation)` - Check approval status
- `getQualityMetrics()` - Quality metrics
- `getMetricsBySupervisor()` - Supervisor metrics
- `getMetricsByCompany()` - Company metrics
- `exportEvaluations()` - Export to CSV/JSON
- `generateQualityReport()` - Generate report

---

## Migration Guide

### For New Code
✅ **Use the facades** - Import from `internship.service.ts` or `evaluation.service.ts`

```typescript
// ✅ DO THIS
import { internshipService } from '../services/internship.service';
import { evaluationService } from '../services/evaluation.service';

// ❌ DON'T DO THIS (unless maintaining old code)
import { InternshipService } from '../services/internshipService';
```

### For Existing Code
⚠️ **No changes required** - Old imports still work for backward compatibility

```typescript
// This still works fine
import { InternshipService } from '../services/internshipService';
```

### Gradual Migration
You can migrate controllers one at a time:

1. Update import statement
2. Replace service instance with facade
3. Test the controller
4. Move to next controller

---

## File Structure

```
backend/src/services/
├── internship.service.ts        ✅ NEW - Unified facade
├── evaluation.service.ts        ✅ NEW - Unified facade
│
├── internshipService.ts         ⚠️ LEGACY - Core CRUD
├── internshipsService.ts        ⚠️ LEGACY - Validation
├── internshipsEnhancedService.ts ⚠️ LEGACY - Advanced features
├── evaluationService.ts         ⚠️ LEGACY - CRUD + AI
└── evaluationsService.ts        ⚠️ LEGACY - Analytics
```

**Note:** Legacy files are marked with `@deprecated` comments but remain functional for backward compatibility.

---

## Example: Updating a Controller

**Before:**
```typescript
import { InternshipService } from '../../services/internshipService';
import { InternshipsService } from '../../services/internshipsService';

export class InternshipsController {
  private crudService = new InternshipService();
  private validationService = new InternshipsService();

  async createInternship(req, res) {
    const validation = await this.validationService.validateInternshipAssignment(...);
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }
    
    const internship = await this.crudService.create(req.body);
    res.json(internship);
  }
}
```

**After:**
```typescript
import { internshipService } from '../../services/internship.service';

export class InternshipsController {
  async createInternship(req, res) {
    const validation = await internshipService.validateInternshipAssignment(...);
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }
    
    const internship = await internshipService.create(req.body);
    res.json(internship);
  }
}
```

**Changes:**
- ✅ Single import
- ✅ No service instances needed
- ✅ Cleaner, more maintainable code

---

## Next Steps

1. ✅ **Phase 1 Complete** - Facades created with full documentation
2. ⏭️ **Phase 2** (Optional) - Gradually migrate controllers to use facades
3. ⏭️ **Phase 3** (Future) - Remove legacy services after full migration

**Current Status:** All old code continues to work. New code can use cleaner facade API.
