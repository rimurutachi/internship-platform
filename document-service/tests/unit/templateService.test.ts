import { templateService } from '../../src/services/templateService';

describe('TemplateService - Validation', () => {
  describe('validateTemplate', () => {
    it('should pass with valid template', () => {
      const result = templateService.validateTemplate({
        name: 'Test Template',
        description: 'A test',
        content: 'Hello {{name}}',
        fields: [{ name: 'name', type: 'text', label: 'Name', required: true }],
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when name is empty', () => {
      const result = templateService.validateTemplate({
        name: '',
        description: 'A test',
        content: 'Content',
        fields: [],
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Template name is required');
    });

    it('should fail when content is empty', () => {
      const result = templateService.validateTemplate({
        name: 'Test',
        description: 'A test',
        content: '',
        fields: [],
      });
      expect(result.valid).toBe(false);
    });

    it('should fail for select field without options', () => {
      const result = templateService.validateTemplate({
        name: 'Test',
        description: 'A test',
        content: 'Content',
        fields: [{ name: 'status', type: 'select', label: 'Status', required: true }],
      });
      expect(result.valid).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should accept valid emails', () => {
      expect(templateService.isValidEmail('test@example.com')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(templateService.isValidEmail('not-an-email')).toBe(false);
      expect(templateService.isValidEmail('')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should accept valid phone numbers', () => {
      expect(templateService.isValidPhone('+63 912 345 6789')).toBe(true);
    });

    it('should reject too-short numbers', () => {
      expect(templateService.isValidPhone('123')).toBe(false);
    });
  });
});
