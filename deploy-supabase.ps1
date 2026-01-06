# ============================================
# Supabase Deployment Script
# Project: MPB Health CTO Dashboard
# ============================================

$ErrorActionPreference = "Stop"
$ProjectRef = "xnijhggwgbxrtvlktviz"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  MPB Health - Supabase Deployment Script       " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Supabase CLI
Write-Host "[1/5] Checking Supabase CLI..." -ForegroundColor Yellow
try {
    $version = npx supabase --version 2>&1
    Write-Host "  Supabase CLI: $version" -ForegroundColor Green
} catch {
    Write-Host "  Installing Supabase CLI..." -ForegroundColor Yellow
    npm install -g supabase
}

# Step 2: Link project
Write-Host ""
Write-Host "[2/5] Linking to Supabase project..." -ForegroundColor Yellow
Write-Host "  Project: $ProjectRef" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Run this command if not already linked:" -ForegroundColor White
Write-Host "  npx supabase link --project-ref $ProjectRef" -ForegroundColor Gray
Write-Host ""

# Step 3: Push migrations
Write-Host "[3/5] Push database migrations..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Run these commands:" -ForegroundColor White
Write-Host ""
Write-Host "  # Dry run first (see what will be applied)" -ForegroundColor Gray
Write-Host "  npx supabase db push --dry-run" -ForegroundColor White
Write-Host ""
Write-Host "  # Apply migrations" -ForegroundColor Gray
Write-Host "  npx supabase db push" -ForegroundColor White
Write-Host ""

# Step 4: Deploy Edge Functions
Write-Host "[4/5] Deploy Edge Functions..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Run this command:" -ForegroundColor White
Write-Host ""
Write-Host "  # Deploy all functions" -ForegroundColor Gray
Write-Host "  npx supabase functions deploy" -ForegroundColor White
Write-Host ""
Write-Host "  # Or deploy specific function" -ForegroundColor Gray
Write-Host "  npx supabase functions deploy outlook-calendar" -ForegroundColor White
Write-Host ""

# Step 5: Add Vercel URL to allowed origins
Write-Host "[5/5] Configure CORS for Vercel..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Your Vercel URL: https://cto-dashboard-lac.vercel.app" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Go to Supabase Dashboard:" -ForegroundColor White
Write-Host "  https://supabase.com/dashboard/project/$ProjectRef/settings/api" -ForegroundColor Gray
Write-Host ""
Write-Host "  Under 'API Settings', add your Vercel domain to allowed origins" -ForegroundColor White
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Quick Commands Reference                      " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  # Full deployment sequence:" -ForegroundColor Gray
Write-Host "  npx supabase link --project-ref $ProjectRef" -ForegroundColor White
Write-Host "  npx supabase db push" -ForegroundColor White
Write-Host "  npx supabase functions deploy" -ForegroundColor White
Write-Host ""
Write-Host "  # Dashboard URLs:" -ForegroundColor Gray
Write-Host "  Dashboard:    https://supabase.com/dashboard/project/$ProjectRef" -ForegroundColor Cyan
Write-Host "  SQL Editor:   https://supabase.com/dashboard/project/$ProjectRef/sql" -ForegroundColor Cyan
Write-Host "  Auth:         https://supabase.com/dashboard/project/$ProjectRef/auth/users" -ForegroundColor Cyan
Write-Host "  Functions:    https://supabase.com/dashboard/project/$ProjectRef/functions" -ForegroundColor Cyan
Write-Host ""
