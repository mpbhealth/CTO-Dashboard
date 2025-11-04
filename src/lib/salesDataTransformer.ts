export interface SalesCSVRow {
  Date: string;
  Name: string;
  Plan: string;
  Size: string;
  Agent: string;
  'Group?': string | boolean;
}

export interface TransformedSalesOrder {
  enrollment_date: string;
  member_name: string;
  plan: string;
  family_size: string;
  rep: string;
  is_group: boolean;
  order_date?: string;
  order_id?: string;
  member_id?: string;
  amount?: string;
  channel?: string;
  status?: string;
}

export const PLAN_PRICING: Record<string, Record<string, number>> = {
  'Secure HSA': {
    'MO': 199.00,
    'M+S': 349.00,
    'M+C': 299.00,
    'M+F': 449.00,
  },
  'Premium HSA': {
    'MO': 299.00,
    'M+S': 499.00,
    'M+C': 399.00,
    'M+F': 599.00,
  },
  'Premium Care': {
    'MO': 349.00,
    'M+S': 599.00,
    'M+C': 499.00,
    'M+F': 699.00,
  },
  'Care Plus': {
    'MO': 249.00,
    'M+S': 449.00,
    'M+C': 349.00,
    'M+F': 549.00,
  },
  'MEC+ESSENTIALS': {
    'MO': 99.00,
    'M+S': 179.00,
    'M+C': 149.00,
    'M+F': 229.00,
  },
  'MEC+Essentials': {
    'MO': 99.00,
    'M+S': 179.00,
    'M+C': 149.00,
    'M+F': 229.00,
  },
  'DIRECT': {
    'MO': 0.00,
    'M+S': 0.00,
    'M+C': 0.00,
    'M+F': 0.00,
  },
};

export function parseSalesDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '') return null;

  const monthMap: Record<string, string> = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
    'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
    'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12',
  };

  if (/^\d{1,2}-[A-Za-z]{3}/.test(dateStr)) {
    const match = dateStr.match(/^(\d{1,2})-([A-Za-z]{3})/);
    if (match) {
      const day = match[1].padStart(2, '0');
      const month = monthMap[match[2]];
      return `2025-${month}-${day}`;
    }
  }

  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(dateStr)) {
    const [month, day, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return dateStr;
  }

  return null;
}

export function calculateAmount(plan: string, size: string): number {
  const pricing = PLAN_PRICING[plan];
  if (pricing && pricing[size] !== undefined) {
    return pricing[size];
  }
  return 0;
}

export function transformSalesRow(row: SalesCSVRow): TransformedSalesOrder {
  const isGroup = row['Group?'] === 'TRUE' ||
                  row['Group?'] === true ||
                  row['Group?'] === 'true';

  return {
    enrollment_date: row.Date || '',
    member_name: row.Name || '',
    plan: row.Plan || '',
    family_size: row.Size || '',
    rep: row.Agent || '',
    is_group: isGroup,
  };
}

export function validateSalesRow(row: SalesCSVRow): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!row.Date || row.Date.trim() === '') {
    errors.push('Date is required');
  }

  if (!row.Name || row.Name.trim() === '') {
    errors.push('Name is required');
  }

  if (!row.Plan || row.Plan.trim() === '') {
    errors.push('Plan is required');
  }

  if (!row.Size || row.Size.trim() === '') {
    errors.push('Size is required');
  }

  if (!row.Agent || row.Agent.trim() === '') {
    errors.push('Agent is required');
  }

  const validSizes = ['MO', 'M+S', 'M+C', 'M+F'];
  if (row.Size && !validSizes.includes(row.Size)) {
    errors.push(`Invalid Size: ${row.Size}. Must be one of: ${validSizes.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getSalesUploadStatistics(data: SalesCSVRow[]) {
  const stats = {
    totalRows: data.length,
    byPlan: {} as Record<string, number>,
    bySize: {} as Record<string, number>,
    byAgent: {} as Record<string, number>,
    groupEnrollments: 0,
    totalAmount: 0,
  };

  data.forEach(row => {
    stats.byPlan[row.Plan] = (stats.byPlan[row.Plan] || 0) + 1;
    stats.bySize[row.Size] = (stats.bySize[row.Size] || 0) + 1;
    stats.byAgent[row.Agent] = (stats.byAgent[row.Agent] || 0) + 1;

    if (row['Group?'] === 'TRUE' || row['Group?'] === true) {
      stats.groupEnrollments++;
    }

    const amount = calculateAmount(row.Plan, row.Size);
    stats.totalAmount += amount;
  });

  return stats;
}
