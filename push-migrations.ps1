# ============================================
# Supabase Migration Push Script
# Project: MPB Health CTO Dashboard
# ============================================

param(
    [switch]$SkipLogin,
    [switch]$DryRun,
    [switch]$Force
)

$ErrorActionPreference = "Continue"
$ProjectRef = "xnijhggwgbxrtvlktviz"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  MPB Health - Supabase Migration Push Script   " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if Supabase CLI is installed
Write-Host "[1/6] Checking Supabase CLI installation..." -ForegroundColor Yellow
$supabaseVersion = $null
try {
    $supabaseVersion = (supabase --version 2>&1) | Out-String
    if ($supabaseVersion -match "(\d+\.\d+\.\d+)") {
        Write-Host "  ✓ Supabase CLI version: $($Matches[1])" -ForegroundColor Green
    } else {
        Write-Host "  ✓ Supabase CLI is installed" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✗ Supabase CLI not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Installing Supabase CLI..." -ForegroundColor Yellow
    npm install -g supabase
    Write-Host "  ✓ Installed! Please run this script again." -ForegroundColor Green
    exit 1
}

# Step 2: Check login status
if (-not $SkipLogin) {
    Write-Host ""
    Write-Host "[2/6] Checking login status..." -ForegroundColor Yellow
    $loginCheck = (supabase projects list 2>&1) | Out-String
    if ($loginCheck -match "not logged in" -or $loginCheck -match "access token" -or $loginCheck -match "unauthorized") {
        Write-Host "  ✗ Not logged in to Supabase" -ForegroundColor Red
        Write-Host ""
        Write-Host "  Please run: supabase login" -ForegroundColor Yellow
        Write-Host "  Then run this script again." -ForegroundColor Yellow
        Write-Host ""
        
        $response = Read-Host "  Would you like to login now? (y/n)"
        if ($response -eq 'y' -or $response -eq 'Y') {
            Write-Host ""
            supabase login
            Write-Host ""
            Write-Host "  ✓ Login complete! Continuing..." -ForegroundColor Green
        } else {
            exit 1
        }
    } else {
        Write-Host "  ✓ Already logged in" -ForegroundColor Green
    }
} else {
    Write-Host ""
    Write-Host "[2/6] Skipping login check..." -ForegroundColor Yellow
}

# Step 3: Link project if not already linked
Write-Host ""
Write-Host "[3/6] Checking project link status..." -ForegroundColor Yellow
$linkStatus = $null
if (Test-Path ".\.supabase\linked_project") {
    Write-Host "  ✓ Project already linked" -ForegroundColor Green
} else {
    Write-Host "  Project not linked. Linking to: $ProjectRef" -ForegroundColor Yellow
    Write-Host ""
    
    if ($DryRun) {
        Write-Host "  [DRY RUN] Would run: supabase link --project-ref $ProjectRef" -ForegroundColor Magenta
    } else {
        $response = Read-Host "  Link to project $ProjectRef? (y/n)"
        if ($response -eq 'y' -or $response -eq 'Y') {
            Write-Host ""
            supabase link --project-ref $ProjectRef
            Write-Host ""
            Write-Host "  ✓ Project linked!" -ForegroundColor Green
        } else {
            Write-Host "  ✗ Skipping link. Migrations may fail." -ForegroundColor Red
        }
    }
}

# Step 4: List pending migrations
Write-Host ""
Write-Host "[4/6] Checking migration files..." -ForegroundColor Yellow
$migrationsPath = ".\supabase\migrations"

if (Test-Path $migrationsPath) {
    $migrationFiles = Get-ChildItem -Path $migrationsPath -Filter "*.sql" | Sort-Object Name
    $totalMigrations = $migrationFiles.Count
    Write-Host "  Found $totalMigrations migration files" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Most recent migrations:" -ForegroundColor White
    $migrationFiles | Select-Object -Last 10 | ForEach-Object {
        $name = $_.Name
        # Check if it's a new file (not tracked in git)
        $isNew = git status --porcelain "supabase/migrations/$name" 2>&1 | Out-String
        if ($isNew -match "^\?\?" -or $isNew -match "^A") {
            Write-Host "    ★ $name [NEW]" -ForegroundColor Green
        } else {
            Write-Host "    - $name" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "  ✗ Migrations folder not found at: $migrationsPath" -ForegroundColor Red
    exit 1
}

# Step 5: Check for pending migrations with Supabase
Write-Host ""
Write-Host "[5/6] Checking migration status with Supabase..." -ForegroundColor Yellow
if ($DryRun) {
    Write-Host "  [DRY RUN] Would run: supabase db push --dry-run" -ForegroundColor Magenta
} else {
    Write-Host "  Running: supabase db push --dry-run" -ForegroundColor White
    Write-Host ""
    supabase db push --dry-run 2>&1
    Write-Host ""
}

# Step 6: Push migrations
Write-Host ""
Write-Host "[6/6] Ready to push migrations" -ForegroundColor Yellow
Write-Host ""

if ($DryRun) {
    Write-Host "  [DRY RUN] Would push all pending migrations" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "  To actually push, run this script without -DryRun" -ForegroundColor Cyan
} else {
    Write-Host "  This will apply ALL pending migrations to your Supabase database." -ForegroundColor White
    Write-Host "  Project: $ProjectRef" -ForegroundColor White
    Write-Host "  URL: https://$ProjectRef.supabase.co" -ForegroundColor White
    Write-Host ""
    
    if ($Force) {
        $confirm = 'y'
    } else {
        $confirm = Read-Host "  Push all migrations? (y/n)"
    }
    
    if ($confirm -eq 'y' -or $confirm -eq 'Y') {
        Write-Host ""
        Write-Host "  Pushing migrations..." -ForegroundColor Cyan
        Write-Host ""
        
        supabase db push 2>&1
        
        $exitCode = $LASTEXITCODE
        Write-Host ""
        
        if ($exitCode -eq 0) {
            Write-Host "================================================" -ForegroundColor Green
            Write-Host "  ✓ Migrations pushed successfully!" -ForegroundColor Green
            Write-Host "================================================" -ForegroundColor Green
        } else {
            Write-Host "================================================" -ForegroundColor Red
            Write-Host "  ✗ Migration push encountered issues" -ForegroundColor Red
            Write-Host "================================================" -ForegroundColor Red
            Write-Host ""
            Write-Host "  Troubleshooting steps:" -ForegroundColor Yellow
            Write-Host "  1. Check the error messages above" -ForegroundColor White
            Write-Host "  2. Try pushing individual migrations:" -ForegroundColor White
            Write-Host "     supabase db push --file supabase/migrations/FILENAME.sql" -ForegroundColor Gray
            Write-Host "  3. Or run migrations manually in SQL Editor:" -ForegroundColor White
            Write-Host "     https://supabase.com/dashboard/project/$ProjectRef/sql" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ✗ Cancelled by user" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Quick Reference Commands" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Login:          supabase login" -ForegroundColor White
Write-Host "  Link Project:   supabase link --project-ref $ProjectRef" -ForegroundColor White
Write-Host "  Dry Run:        supabase db push --dry-run" -ForegroundColor White
Write-Host "  Push All:       supabase db push" -ForegroundColor White
Write-Host "  Push Single:    supabase db push --file supabase/migrations/FILENAME.sql" -ForegroundColor White
Write-Host ""
Write-Host "  Dashboard:      https://supabase.com/dashboard/project/$ProjectRef" -ForegroundColor Cyan
Write-Host "  SQL Editor:     https://supabase.com/dashboard/project/$ProjectRef/sql" -ForegroundColor Cyan
Write-Host ""
