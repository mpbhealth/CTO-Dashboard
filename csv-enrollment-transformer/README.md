# CSV Enrollment Transformer

A robust, idempotent CSV transformer that maps historical enrollment/status feeds into a standardized template schema for MPB Health.

## Features

- **Robust data validation** using Zod schemas
- **Multiple date format support** (ISO, US format, ISO with timezone)
- **Currency parsing** with symbol stripping and decimal formatting  
- **Agent ID extraction** from enrollment source fields
- **Intelligent merge logic** for duplicate member/program combinations
- **Comprehensive error handling** and validation reporting
- **Idempotent transformations** - same input always produces same output

## Installation

```bash
npm install
```

## Build

```bash
npm run build
```

## Usage

### Command Line Interface

```bash
# Transform a CSV file
npm run transform -- --input input.csv --output output.csv

# Or use the built version
node dist/transform.js --input input.csv --output output.csv
```

### Programmatic Usage

```typescript
import { transformCsv } from './src/transform';

await transformCsv('input.csv', 'output.csv');
```

## Input Schema

The transformer expects CSV input with the following columns:

- `record_type` *(required)* - "enrollment", "status_update", or "both"
- `member_id` *(required)* - Unique member identifier
- `enrollment_id` - Enrollment record ID
- `enrollment_date` - Date of enrollment
- `program_name` - Name of the program/product
- `enrollment_status` - Current enrollment status
- `enrollment_source` - Source of enrollment (may contain agent info)
- `premium_amount` - Monthly premium amount
- `renewal_date` - Next renewal date
- `status_date` - Date of status change
- `new_status` - New status value
- `reason` - Reason for status change
- `source_system` - Originating system

## Output Schema

Produces a CSV with these columns in order:

1. `ID Customer` - Member ID (trimmed)
2. `ID Product` - Internal product code via lookup
3. `Date Active` - Enrollment activation date
4. `Date Inactive` - Termination date (if applicable)
5. `Name First` - First name (blank - not in source)
6. `Name Last` - Last name (blank - not in source)
7. `Product Admin Label` - Admin-friendly product label
8. `Product Benefit ID` - Benefit catalog ID
9. `Product Label` - Product name
10. `Date Created Member` - Member creation date
11. `Date First Billing` - First billing date
12. `Date Last Payment` - Last payment date (blank - not in source)
13. `Date Next Billing` - Next billing date
14. `ID Agent` - Agent identifier (extracted from source)
15. `Last Payment` - Last payment amount (blank - not in source)
16. `Last Transaction Amount` - Last transaction (blank - not in source)
17. `Product Amount` - Product premium amount

## Data Transformations

### Record Type Logic

- **enrollment**: Sets Date Active from enrollment_date, Date Inactive remains blank
- **status_update**: Sets Date Inactive from status_date if new_status is inactive
- **both**: Sets both Date Active and Date Inactive as applicable

### Date Parsing

Supports multiple input formats:
- ISO format: `2023-12-01`
- US format: `12/01/2023`
- ISO with timezone: `2023-12-01T10:30:00Z`

All dates are normalized to `YYYY-MM-DD` format.

### Currency Handling

- Strips currency symbols (`$`, `,`, spaces)
- Validates numeric values
- Formats to 2 decimal places
- Invalid values become empty strings

### Agent ID Extraction

Parses agent IDs from enrollment_source patterns:
- `agent:1234` → `1234`
- `agent#5678` → `5678`
- Case insensitive matching

### Merge Logic

When multiple rows have the same member_id + program_name:
- **Date Active**: Uses earliest date
- **Date Inactive**: Uses latest date  
- **Product Amount**: Uses last non-empty value
- **Date Next Billing**: Uses last non-empty value

### Status Classification

These terms indicate inactive/terminated status:
- inactive
- cancelled  
- canceled
- terminated

## Customizing Lookups

Edit `src/lookups.ts` to modify the product mappings:

```typescript
export const productCodeMap: Record<string, string> = {
  'MPB Essentials': 'PROD-ESS',
  'MPB Plus': 'PROD-PLUS',
  'MPB Premium': 'PROD-PREM',
  // Add new mappings here
};
```

## Validation

The transformer performs comprehensive validation:

- ✅ All target columns present in correct order
- ✅ ID Customer is not empty
- ✅ Date Active ≤ Date Inactive when both exist
- ✅ Product Amount is numeric or empty
- ✅ Source data meets schema requirements

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## Error Handling

- Invalid rows are logged with line numbers but don't stop processing
- Empty member_id rows are automatically filtered out
- Invalid dates are logged as warnings but don't fail transformation
- All validation errors include specific row numbers and details

## Development

```bash
# Run in development mode
npm run dev -- --input sample.csv --output result.csv

# Clean build artifacts  
npm run clean
```

## Assumptions

1. **Names not available**: Name First/Last fields are left blank unless data is enriched from external sources
2. **Payment data not in source**: Payment-related fields remain blank
3. **Agent ID format**: Agent IDs follow `agent:ID` or `agent#ID` patterns in enrollment_source
4. **Idempotent processing**: Same input file will always produce identical output
5. **Date precedence**: For merging, earliest active dates and latest inactive dates are preferred

## Changelog

### v1.0.0
- Initial release with full transformation pipeline
- Comprehensive validation and error handling
- Support for all specified date formats and transformations
- CLI interface with proper error reporting