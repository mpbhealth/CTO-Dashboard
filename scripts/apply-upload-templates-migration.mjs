#!/usr/bin/env node

/**
 * This script applies the upload_templates migration directly to the Supabase database
 * since the MCP Supabase tools are not working in this environment.
 */

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

console.log('🚀 Applying Upload Templates Migration');
console.log('=======================================\n');
console.log('📡 Database:', SUPABASE_URL);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Read the migration file
const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251105000001_create_upload_templates_table.sql');
const migrationSQL = readFileSync(migrationPath, 'utf8');

console.log('📄 Migration file loaded\n');
console.log('⚠️  Note: Direct SQL execution through Supabase client API is limited.');
console.log('   This script will attempt to apply via RPC, but may require manual execution.\n');

async function main() {
  try {
    // Try to check if table exists first
    const { data: existing, error: checkError } = await supabase
      .from('upload_templates')
      .select('id')
      .limit(1);

    if (checkError && checkError.code === 'PGRST205') {
      console.log('❌ Table does not exist and needs to be created.');
      console.log('\n📋 ACTION REQUIRED:');
      console.log('================\n');
      console.log('Please manually execute the migration SQL in Supabase Dashboard:\n');
      console.log('1. Open: https://supabase.com/dashboard/project/xnijhggwgbxrtvlktviz/sql/new');
      console.log('2. Paste the SQL from: supabase/migrations/20251105000001_create_upload_templates_table.sql');
      console.log('3. Click "Run"\n');
      console.log('Migration file contents:\n');
      console.log('---START SQL---');
      console.log(migrationSQL);
      console.log('---END SQL---\n');
      return;
    }

    if (!checkError) {
      console.log('✅ Table already exists!');

      // Check how many templates exist
      const { data: templates, error: countError } = await supabase
        .from('upload_templates')
        .select('department, is_active')
        .eq('is_active', true);

      if (!countError && templates) {
        console.log(`\n📊 Found ${templates.length} active templates:`);
        templates.forEach(t => console.log(`   • ${t.department}`));

        if (templates.length === 7) {
          console.log('\n✨ All templates are present! No action needed.');
        } else {
          console.log('\n⚠️  Expected 7 templates, but found', templates.length);
          console.log('   Consider re-running the migration to add missing templates.');
        }
      }
    }

  } catch (error) {
    console.error('\n💥 Error:', error.message);
  }
}

main();
