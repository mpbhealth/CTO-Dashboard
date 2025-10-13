# ============================================
# Setup New HIPAA Database - Quick Setup Script
# ============================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " MPB Health - New HIPAA Database Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create .env.local file
Write-Host "Step 1: Creating .env.local file..." -ForegroundColor Yellow
Write-Host ""

if (Test-Path ".env.local") {
    Write-Host "  Warning: .env.local already exists!" -ForegroundColor Red
    $backup = Read-Host "  Do you want to backup the old .env.local? (y/n)"
    if ($backup -eq 'y' -or $backup -eq 'Y') {
        Copy-Item ".env.local" ".env.local.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Write-Host "  ✓ Backup created!" -ForegroundColor Green
    }
}

# Copy the NEW_ENV_FILE.txt to .env.local
Copy-Item "NEW_ENV_FILE.txt" ".env.local"
Write-Host "  ✓ .env.local created successfully!" -ForegroundColor Green
Write-Host ""

# Step 2: Display connection info
Write-Host "Step 2: Database Connection Info" -ForegroundColor Yellow
Write-Host "  Database URL: https://xnijhggwgbxrtvlktviz.supabase.co" -ForegroundColor White
Write-Host "  Anon Key: ey...Y-Y (configured)" -ForegroundColor White
Write-Host "  ✓ Credentials configured!" -ForegroundColor Green
Write-Host ""

# Step 3: Open Supabase Dashboard
Write-Host "Step 3: Opening Supabase Dashboard..." -ForegroundColor Yellow
Write-Host ""

$response = Read-Host "  Open SQL Editor to run migrations? (y/n)"
if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Host "  Opening SQL Editor..." -ForegroundColor Green
    Start-Process "https://supabase.com/dashboard/project/xnijhggwgbxrtvlktviz/editor"
    Start-Sleep -Seconds 1
}

# Step 4: Instructions for migrations
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " NEXT STEPS - Run Migrations" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option A: Using Supabase CLI (Recommended)" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. Install CLI:" -ForegroundColor White
Write-Host "     npm install -g supabase" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Login:" -ForegroundColor White
Write-Host "     supabase login" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Link project:" -ForegroundColor White
Write-Host "     supabase link --project-ref xnijhggwgbxrtvlktviz" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. Push migrations:" -ForegroundColor White
Write-Host "     supabase db push" -ForegroundColor Gray
Write-Host ""
Write-Host "Option B: Manual Migration (If CLI does not work)" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. Go to SQL Editor (opened in browser)" -ForegroundColor White
Write-Host "  2. Run migrations from supabase/migrations/ folder" -ForegroundColor White
Write-Host "  3. Start with HIPAA setup files (000001-000004)" -ForegroundColor White
Write-Host "  4. Then run all others in order" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " AFTER MIGRATIONS - Test Locally" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "  Then open:" -ForegroundColor White
Write-Host "    http://localhost:5173/         (CTO Dashboard)" -ForegroundColor Gray
Write-Host "    http://localhost:5173/ceo      (CEO Portal)" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " UPDATE NETLIFY (For Production)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1. Go to Netlify dashboard" -ForegroundColor White
Write-Host "  2. Site configuration > Environment variables" -ForegroundColor White
Write-Host "  3. Update:" -ForegroundColor White
Write-Host ""
Write-Host "     VITE_SUPABASE_URL = https://xnijhggwgbxrtvlktviz.supabase.co" -ForegroundColor Gray
Write-Host "     VITE_SUPABASE_ANON_KEY = eyJ...Y-Y" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. Trigger new deploy" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "✓ Setup complete! Ready for migrations." -ForegroundColor Green
Write-Host ""
Write-Host "Need help? Read: MIGRATION_QUICK_START.md" -ForegroundColor Cyan
Write-Host ""

