# Supabase Migration Check Script
Write-Host "=== Supabase Migration Helper ===" -ForegroundColor Cyan

# Check if Supabase CLI is installed
Write-Host "`nChecking Supabase CLI..." -ForegroundColor Yellow
try {
    $version = supabase --version 2>&1
    Write-Host "Supabase CLI version: $version" -ForegroundColor Green
} catch {
    Write-Host "Supabase CLI not found. Installing via npm..." -ForegroundColor Red
    npm install -g supabase
}

# Check if we're logged in
Write-Host "`nChecking login status..." -ForegroundColor Yellow
$projects = supabase projects list 2>&1
if ($projects -match "not logged in" -or $projects -match "error") {
    Write-Host "Not logged in. Please run: supabase login" -ForegroundColor Red
} else {
    Write-Host "Logged in successfully" -ForegroundColor Green
    Write-Host $projects
}

# Check if project is linked
Write-Host "`nChecking if project is linked..." -ForegroundColor Yellow
if (Test-Path ".\.supabase\") {
    Write-Host "Project is linked" -ForegroundColor Green
} else {
    Write-Host "Project is not linked. You'll need to run: supabase link --project-ref YOUR_PROJECT_REF" -ForegroundColor Yellow
}

# List pending migrations
Write-Host "`nChecking migration status..." -ForegroundColor Yellow
$migrationFiles = Get-ChildItem -Path ".\supabase\migrations\" -Filter "*.sql" | Sort-Object Name
Write-Host "Found $($migrationFiles.Count) migration files" -ForegroundColor Cyan

# Show the most recent 5 migrations
Write-Host "`nMost recent migrations:" -ForegroundColor Yellow
$migrationFiles | Select-Object -Last 10 | ForEach-Object {
    Write-Host "  - $($_.Name)" -ForegroundColor Gray
}

Write-Host "`n=== Instructions ===" -ForegroundColor Cyan
Write-Host "1. If not logged in, run: supabase login" -ForegroundColor White
Write-Host "2. Link your project: supabase link --project-ref YOUR_PROJECT_REF" -ForegroundColor White
Write-Host "3. Push migrations: supabase db push" -ForegroundColor White
Write-Host "4. Or apply single migration: supabase db push --file supabase/migrations/FILENAME.sql" -ForegroundColor White
