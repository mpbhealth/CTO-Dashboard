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

console.log('🔧 Supabase Staging Tables Fix Script');
console.log('======================================\n');
console.log('📡 Connecting to:', SUPABASE_URL);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTables() {
  console.log('\n📋 Checking existing staging tables...');

  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .like('table_name', 'stg_%');

  if (error) {
    console.error('❌ Error checking tables:', error.message);
    // Try alternative method with RPC
    const { data: tables, error: rpcError } = await supabase.rpc('exec', {
      sql: `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name LIKE 'stg_%'
        ORDER BY table_name;
      `
    });

    if (rpcError) {
      console.error('❌ RPC Error:', rpcError.message);
      return [];
    }

    return tables || [];
  }

  return data || [];
}

async function testTableAccess(tableName) {
  console.log(`\n🧪 Testing access to ${tableName}...`);

  const { data, error, count } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error(`❌ ${tableName}: ${error.message} (Code: ${error.code})`);
    return false;
  } else {
    console.log(`✅ ${tableName}: Accessible (${count || 0} rows)`);
    return true;
  }
}

async function testUploadTemplatesAccess() {
  console.log(`\n🧪 Testing upload_templates table...`);

  const { data, error } = await supabase
    .from('upload_templates')
    .select('*')
    .eq('is_active', true)
    .order('department');

  if (error) {
    console.error(`❌ upload_templates: ${error.message} (Code: ${error.code})`);
    return false;
  } else {
    console.log(`✅ upload_templates: Accessible (${data.length} active templates)`);
    if (data.length > 0) {
      console.log('   Available departments:', data.map(t => t.department).join(', '));
    }
    return true;
  }
}

async function main() {
  try {
    // Check existing tables
    const existingTables = await checkTables();
    console.log('\nExisting staging tables:', existingTables.map(t => t.table_name || t).join(', ') || 'None found');

    // Test access to required tables
    console.log('\n📊 Testing Table Access');
    console.log('=======================');

    const requiredTables = [
      'stg_concierge_interactions',
      'stg_sales_orders',
      'stg_sales_leads',
      'stg_sales_cancelations',
      'department_uploads'
    ];

    const results = {};

    for (const table of requiredTables) {
      results[table] = await testTableAccess(table);
    }

    await testUploadTemplatesAccess();

    // Summary
    console.log('\n📈 Summary');
    console.log('==========');
    const missingTables = Object.entries(results).filter(([_, exists]) => !exists).map(([table]) => table);

    if (missingTables.length === 0) {
      console.log('✅ All required staging tables exist and are accessible!');
    } else {
      console.log('❌ Missing or inaccessible tables:', missingTables.join(', '));
      console.log('\n🔧 These tables need to be created via Supabase dashboard migrations.');
    }

    console.log('\n✨ Check complete!');

  } catch (error) {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
  }
}

main();
