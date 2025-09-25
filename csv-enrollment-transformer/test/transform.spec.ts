import { transformCsv } from '../src/transform';
import { parseDate, parseCurrency, parseAgentId, isInactiveStatus } from '../src/transform';
import * as fs from 'fs';
import * as path from 'path';

describe('CSV Enrollment Transformer', () => {
  const testDataDir = path.join(__dirname, 'data');
  const inputFile = path.join(testDataDir, 'input.csv');
  const outputFile = path.join(testDataDir, 'output.csv');

  beforeAll(() => {
    // Create test data directory
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up output file
    if (fs.existsSync(outputFile)) {
      fs.unlinkSync(outputFile);
    }
  });

  describe('Date parsing', () => {
    test('should parse various date formats correctly', () => {
      expect(parseDate('2023-12-01')).toBe('2023-12-01');
      expect(parseDate('12/01/2023')).toBe('2023-12-01');
      expect(parseDate('2023-12-01T10:30:00Z')).toBe('2023-12-01');
      expect(parseDate('')).toBe('');
      expect(parseDate(undefined)).toBe('');
    });
  });

  describe('Currency parsing', () => {
    test('should parse currency values correctly', () => {
      expect(parseCurrency('$29.99')).toBe('29.99');
      expect(parseCurrency('1,234.56')).toBe('1234.56');
      expect(parseCurrency('  $50.00  ')).toBe('50.00');
      expect(parseCurrency('')).toBe('');
      expect(parseCurrency('invalid')).toBe('');
    });
  });

  describe('Agent ID parsing', () => {
    test('should extract agent IDs from enrollment source', () => {
      expect(parseAgentId('agent:1234')).toBe('1234');
      expect(parseAgentId('agent#5678')).toBe('5678');
      expect(parseAgentId('AGENT:ABC123')).toBe('ABC123');
      expect(parseAgentId('direct')).toBe('');
      expect(parseAgentId('')).toBe('');
    });
  });

  describe('Inactive status detection', () => {
    test('should detect inactive status terms', () => {
      expect(isInactiveStatus('inactive')).toBe(true);
      expect(isInactiveStatus('cancelled')).toBe(true);
      expect(isInactiveStatus('TERMINATED')).toBe(true);
      expect(isInactiveStatus('active')).toBe(false);
      expect(isInactiveStatus('')).toBe(false);
    });
  });

  describe('Full transformation', () => {
    test('should transform enrollment data correctly', async () => {
      // Create test input CSV
      const inputData = [
        'record_type,enrollment_id,member_id,enrollment_date,program_name,enrollment_status,enrollment_source,premium_amount,renewal_date,status_date,new_status,reason,source_system',
        'enrollment,E001,M001,2023-01-15,MPB Essentials,active,agent:1234,$29.99,2024-01-15,,,system1',
        'status_update,E001,M001,,,,,,,2023-06-15,inactive,non-payment,system1',
        'both,E002,M002,2023-03-01,MPB Plus,active,direct,$49.99,2024-03-01,2023-12-01,cancelled,voluntary,system2'
      ].join('\n');
      
      fs.writeFileSync(inputFile, inputData, 'utf8');

      // Run transformation
      await transformCsv(inputFile, outputFile);

      // Verify output exists
      expect(fs.existsSync(outputFile)).toBe(true);

      // Read and parse output
      const outputData = fs.readFileSync(outputFile, 'utf8');
      const lines = outputData.trim().split('\n');
      
      // Should have header + 2 data rows (M001 and M002)
      expect(lines.length).toBeGreaterThanOrEqual(3);
      
      // Verify header contains all required columns
      const header = lines[0];
      expect(header).toContain('ID Customer');
      expect(header).toContain('ID Product');
      expect(header).toContain('Date Active');
      expect(header).toContain('Date Inactive');
    });

    test('should handle merge logic correctly', async () => {
      // Create test input with duplicate member/program
      const inputData = [
        'record_type,enrollment_id,member_id,enrollment_date,program_name,enrollment_status,enrollment_source,premium_amount,renewal_date,status_date,new_status,reason,source_system',
        'enrollment,E001,M001,2023-01-15,MPB Essentials,active,agent:1234,$29.99,2024-01-15,,,system1',
        'status_update,E001,M001,,,MPB Essentials,,,,2023-06-15,inactive,non-payment,system1'
      ].join('\n');
      
      fs.writeFileSync(inputFile, inputData, 'utf8');

      // Run transformation
      await transformCsv(inputFile, outputFile);

      // Read output
      const outputData = fs.readFileSync(outputFile, 'utf8');
      const lines = outputData.trim().split('\n');
      
      // Should merge into single row
      expect(lines.length).toBe(2); // header + 1 merged row
      
      // Parse the merged row
      const dataRow = lines[1].split(',');
      expect(dataRow[0]).toBe('M001'); // ID Customer
      expect(dataRow[2]).toBe('2023-01-15'); // Date Active
      expect(dataRow[3]).toBe('2023-06-15'); // Date Inactive
    });

    test('should validate output correctly', async () => {
      // Create test input with invalid data
      const inputData = [
        'record_type,enrollment_id,member_id,enrollment_date,program_name,enrollment_status,enrollment_source,premium_amount,renewal_date,status_date,new_status,reason,source_system',
        'enrollment,E001,,2023-01-15,MPB Essentials,active,agent:1234,$29.99,2024-01-15,,,system1' // empty member_id
      ].join('\n');
      
      fs.writeFileSync(inputFile, inputData, 'utf8');

      // Should not throw but should skip invalid rows
      await expect(transformCsv(inputFile, outputFile)).resolves.not.toThrow();
      
      // Output should only have header (no valid data rows)
      const outputData = fs.readFileSync(outputFile, 'utf8');
      const lines = outputData.trim().split('\n');
      expect(lines.length).toBe(1); // only header
    });
  });
});