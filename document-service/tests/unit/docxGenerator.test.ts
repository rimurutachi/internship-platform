import { docxGenerator } from '../../src/utils/docxGenerator';
import axios from 'axios';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

jest.mock('axios');
jest.mock('pizzip');
jest.mock('docxtemplater');

describe('docxGenerator', () => {
  const mockAxiosGet = axios.get as jest.Mock;
  const mockPizZip = PizZip as unknown as jest.Mock;
  const mockDocxtemplater = Docxtemplater as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should download a docx, inject fields, and return a buffer', async () => {
    // Mock axios response with fake buffer
    const fakeArrayBuffer = new ArrayBuffer(8);
    mockAxiosGet.mockResolvedValue({ data: fakeArrayBuffer });

    // Mock PizZip constructor
    const fakeZipInstance = { name: 'fakeZip' };
    mockPizZip.mockImplementation(() => fakeZipInstance);

    // Mock Docxtemplater instance
    const mockRender = jest.fn();
    const mockGetZip = jest.fn().mockReturnValue({
      generate: jest.fn().mockReturnValue(Buffer.from('generated-docx-content')),
    });
    
    mockDocxtemplater.mockImplementation(() => ({
      render: mockRender,
      getZip: mockGetZip,
    }));

    const fileUrl = 'https://fake-supabase.com/file.docx';
    const fieldValues = { student_name: 'John Doe', company_name: 'Tech Corp' };

    const result = await docxGenerator.generateFromUrl(fileUrl, fieldValues);

    expect(mockAxiosGet).toHaveBeenCalledWith(fileUrl, { responseType: 'arraybuffer' });
    expect(mockPizZip).toHaveBeenCalledWith(fakeArrayBuffer);
    expect(mockDocxtemplater).toHaveBeenCalled();
    expect(mockRender).toHaveBeenCalledWith(fieldValues);
    expect(result).toBeInstanceOf(Buffer);
    expect(result.toString()).toBe('generated-docx-content');
  });

  it('should throw an error if download fails', async () => {
    mockAxiosGet.mockRejectedValue(new Error('Network error'));
    
    await expect(
      docxGenerator.generateFromUrl('http://bad.url', {})
    ).rejects.toThrow('Network error');
  });

  describe('extractFieldsFromUrl', () => {
    it('should correctly parse brackets and return unique fields', async () => {
      mockAxiosGet.mockResolvedValue({ data: new ArrayBuffer(8) });
      mockPizZip.mockImplementation(() => ({ name: 'fakeZip' }));

      mockDocxtemplater.mockImplementation(() => ({
        getFullText: jest.fn().mockReturnValue('Hello [INSERT NAME], welcome to [COMPANY]. Please sign by [END DATE]. [INSERT NAME] is here.')
      }));

      const fields = await docxGenerator.extractFieldsFromUrl('http://fake-url');
      
      expect(fields).toHaveLength(3);
      expect(fields).toEqual([
        { name: 'INSERT NAME', label: 'INSERT NAME', required: true },
        { name: 'COMPANY', label: 'COMPANY', required: true },
        { name: 'END DATE', label: 'END DATE', required: true }
      ]);
    });

    it('should ignore single character or purely numeric brackets', async () => {
      mockAxiosGet.mockResolvedValue({ data: new ArrayBuffer(8) });
      mockDocxtemplater.mockImplementation(() => ({
        getFullText: jest.fn().mockReturnValue('Reference [123] and [a] and [VALID FIELD]')
      }));

      const fields = await docxGenerator.extractFieldsFromUrl('http://fake-url');
      
      expect(fields).toHaveLength(1);
      expect(fields[0].name).toBe('VALID FIELD');
    });
  });
});
