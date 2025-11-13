#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read environment variables
const envPath = join(__dirname, '..', '.env');
const envContent = readFileSync(envPath, 'utf8');
const SUPABASE_URL = envContent.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const SUPABASE_ANON_KEY = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

console.log('🔧 Creating upload_templates Table');
console.log('===================================\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false
  }
});

const CREATE_TABLE_SQL = `
-- Create upload_templates table
CREATE TABLE IF NOT EXISTS upload_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department text NOT NULL,
  template_name text NOT NULL,
  version integer DEFAULT 1,
  schema_definition jsonb NOT NULL,
  sample_data jsonb,
  instructions text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(department, version)
);

-- Enable RLS
ALTER TABLE upload_templates ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read
CREATE POLICY IF NOT EXISTS "All authenticated users can view active templates"
  ON upload_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create policy for admins to manage
CREATE POLICY IF NOT EXISTS "Admins can manage templates"
  ON upload_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ceo', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ceo', 'admin')
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_upload_templates_department ON upload_templates(department);
CREATE INDEX IF NOT EXISTS idx_upload_templates_active ON upload_templates(is_active) WHERE is_active = true;
`;

const templates = [
  {
    department: 'concierge',
    template_name: 'Concierge Interactions Upload',
    version: 1,
    schema_definition: {
      columns: [
        { name: 'occurred_at', type: 'timestamp', required: true },
        { name: 'member_id', type: 'text', required: false },
        { name: 'agent_name', type: 'text', required: true },
        { name: 'channel', type: 'text', required: true },
        { name: 'result', type: 'text', required: true },
        { name: 'duration_minutes', type: 'integer', required: false },
        { name: 'notes', type: 'text', required: false }
      ]
    },
    sample_data: [
      {
        occurred_at: '2025-01-15 10:30:00',
        member_id: 'M12345',
        agent_name: 'John Smith',
        channel: 'Phone',
        result: 'Resolved',
        duration_minutes: 15,
        notes: 'Billing inquiry'
      }
    ],
    instructions: 'Upload concierge interaction records. Include timestamps, agent names, channels, and outcomes.',
    is_active: true
  },
  {
    department: 'sales',
    template_name: 'Sales Orders Upload',
    version: 1,
    schema_definition: {
      columns: [
        { name: 'Date', type: 'text', required: true },
        { name: 'Name', type: 'text', required: true },
        { name: 'Plan', type: 'text', required: true },
        { name: 'Size', type: 'text', required: true },
        { name: 'Agent', type: 'text', required: true },
        { name: 'Group?', type: 'text', required: false }
      ]
    },
    sample_data: [
      {
        Date: '1-Oct',
        Name: 'John Doe',
        Plan: 'Premium HSA',
        Size: 'M+S',
        Agent: 'Sarah Johnson',
        'Group?': 'FALSE'
      }
    ],
    instructions: 'Upload sales enrollment records. Date format: "1-Oct" or "10/1/2025". Group field should be TRUE/FALSE.',
    is_active: true
  },
  {
    department: 'sales-leads',
    template_name: 'Sales Leads Upload',
    version: 1,
    schema_definition: {
      columns: [
        { name: 'Date', type: 'text', required: true },
        { name: 'Name', type: 'text', required: true },
        { name: 'Source', type: 'text', required: true },
        { name: 'Status', type: 'text', required: true },
        { name: 'Lead Owner', type: 'text', required: true },
        { name: 'Group Lead?', type: 'text', required: false },
        { name: 'Recent Notes', type: 'text', required: false }
      ]
    },
    sample_data: [
      {
        Date: '10/15/2025',
        Name: 'Jane Smith',
        Source: 'Website Visit',
        Status: 'In Process',
        'Lead Owner': 'Mike Brown',
        'Group Lead?': 'FALSE',
        'Recent Notes': 'Left VM'
      }
    ],
    instructions: 'Upload lead tracking data. Date format: "MM/DD/YYYY" or "1-Oct". Status: In Process, First Attempt, Closed, Not Contacted.',
    is_active: true
  },
  {
    department: 'sales-cancelations',
    template_name: 'Sales Cancelations Upload',
    version: 1,
    schema_definition: {
      columns: [
        { name: 'Name:', type: 'text', required: true },
        { name: 'Reason:', type: 'text', required: true },
        { name: 'Membership:', type: 'text', required: true },
        { name: 'Advisor:', type: 'text', required: true },
        { name: 'Outcome:', type: 'text', required: false }
      ]
    },
    sample_data: [
      {
        'Name:': 'John Doe',
        'Reason:': 'Financial Reasons',
        'Membership:': 'Premium HSA',
        'Advisor:': 'Emily Rodriguez',
        'Outcome:': 'Left VM, will try again'
      }
    ],
    instructions: 'Upload member cancelation reports. Include name, reason, membership type, advisor, and outcome notes.',
    is_active: true
  },
  {
    department: 'finance',
    template_name: 'Finance Records Upload',
    version: 1,
    schema_definition: {
      columns: [
        { name: 'record_date', type: 'date', required: true, format: 'YYYY-MM-DD' },
        { name: 'category', type: 'text', required: true, values: ['ar', 'ap', 'payout', 'revenue', 'expense'] },
        { name: 'amount', type: 'decimal', required: true },
        { name: 'description', type: 'text', required: false },
        { name: 'vendor_customer', type: 'text', required: false },
        { name: 'status', type: 'text', required: false }
      ]
    },
    sample_data: [
      {
        record_date: '2025-01-15',
        category: 'ar',
        amount: 50000,
        description: 'Client Invoice Payment',
        vendor_customer: 'ABC Corp',
        status: 'received'
      }
    ],
    instructions: 'Upload finance records including AR, AP, payouts, revenue, and expenses. Ensure dates are in YYYY-MM-DD format.',
    is_active: true
  },
  {
    department: 'operations',
    template_name: 'Plan Cancellations Upload',
    version: 1,
    schema_definition: {
      columns: [
        { name: 'cancel_date', type: 'date', required: true, format: 'YYYY-MM-DD' },
        { name: 'member_id', type: 'text', required: false },
        { name: 'reason', type: 'text', required: true },
        { name: 'agent', type: 'text', required: false },
        { name: 'save_attempted', type: 'boolean', required: false },
        { name: 'save_successful', type: 'boolean', required: false },
        { name: 'mrr_lost', type: 'decimal', required: true }
      ]
    },
    sample_data: [
      {
        cancel_date: '2025-01-15',
        member_id: 'M12345',
        reason: 'Cost',
        agent: 'Emily Rodriguez',
        save_attempted: true,
        save_successful: false,
        mrr_lost: 150
      }
    ],
    instructions: 'Upload plan cancellation records. Include cancellation dates, reasons, save attempts, and MRR impact.',
    is_active: true
  },
  {
    department: 'saudemax',
    template_name: 'SaudeMAX Program Upload',
    version: 1,
    schema_definition: {
      columns: [
        { name: 'enrollment_date', type: 'date', required: true },
        { name: 'member_id', type: 'text', required: true },
        { name: 'program_type', type: 'text', required: true },
        { name: 'status', type: 'text', required: false },
        { name: 'engagement_score', type: 'integer', required: false },
        { name: 'satisfaction_score', type: 'integer', required: false },
        { name: 'health_improvement', type: 'decimal', required: false }
      ]
    },
    sample_data: [
      {
        enrollment_date: '2025-01-15',
        member_id: 'M12345',
        program_type: 'Wellness Coaching',
        status: 'active',
        engagement_score: 85,
        satisfaction_score: 90,
        health_improvement: 12.5
      }
    ],
    instructions: 'Upload SaudeMAX program enrollment and outcomes data. Track member engagement and health improvements.',
    is_active: true
  }
];

async function main() {
  try {
    console.log('📝 Note: Table creation must be done via Supabase Dashboard');
    console.log('   SQL Migration SQL has been prepared above.\n');

    console.log('🧪 Testing if upload_templates table exists...');

    const { data: existingTemplates, error: checkError } = await supabase
      .from('upload_templates')
      .select('department')
      .limit(1);

    if (checkError && checkError.code === 'PGRST205') {
      console.log('❌ Table does not exist. Creating via direct insert will fail.');
      console.log('\n📋 Manual Steps Required:');
      console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Run the following SQL:\n');
      console.log(CREATE_TABLE_SQL);
      console.log('\n4. Then run this script again to insert templates.');
      return;
    }

    if (checkError) {
      console.error('❌ Unexpected error:', checkError.message);
      return;
    }

    console.log('✅ Table exists! Inserting templates...\n');

    let insertedCount = 0;
    let skippedCount = 0;

    for (const template of templates) {
      // Check if template already exists
      const { data: existing } = await supabase
        .from('upload_templates')
        .select('id')
        .eq('department', template.department)
        .eq('version', template.version)
        .maybeSingle();

      if (existing) {
        console.log(`⏭️  Skipping ${template.department} - already exists`);
        skippedCount++;
        continue;
      }

      // Insert template
      const { error: insertError } = await supabase
        .from('upload_templates')
        .insert(template);

      if (insertError) {
        console.error(`❌ Error inserting ${template.department}:`, insertError.message);
      } else {
        console.log(`✅ Inserted ${template.department} template`);
        insertedCount++;
      }
    }

    console.log(`\n📊 Summary: ${insertedCount} inserted, ${skippedCount} skipped`);

    // Verify final state
    const { data: allTemplates, error: verifyError } = await supabase
      .from('upload_templates')
      .select('department, template_name, is_active')
      .eq('is_active', true)
      .order('department');

    if (!verifyError && allTemplates) {
      console.log('\n✨ Active Templates:');
      allTemplates.forEach(t => {
        console.log(`   • ${t.department}: ${t.template_name}`);
      });
    }

  } catch (error) {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
  }
}

main();
