# Open New HIPAA Supabase Dashboard
# Run this script to quickly open the Supabase dashboard

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Opening New HIPAA Supabase Dashboard" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your new database:" -ForegroundColor Yellow
Write-Host "  Project ID: xnijhggwgbxrtvlktviz" -ForegroundColor White
Write-Host "  URL: https://xnijhggwgbxrtvlktviz.supabase.co" -ForegroundColor White
Write-Host ""

# Open API settings page to get anon key
Write-Host "Opening API Settings page to get your anon key..." -ForegroundColor Green
Start-Process "https://supabase.com/dashboard/project/xnijhggwgbxrtvlktviz/settings/api"

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " NEXT STEPS:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Copy the 'anon' / 'public' key from the page" -ForegroundColor Yellow
Write-Host "   (It starts with 'eyJ...')" -ForegroundColor White
Write-Host ""
Write-Host "2. Create a file named '.env.local' in your project root" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Add this content (replace with your actual key):" -ForegroundColor Yellow
Write-Host ""
Write-Host "VITE_SUPABASE_URL=https://xnijhggwgbxrtvlktviz.supabase.co" -ForegroundColor White
Write-Host "VITE_SUPABASE_ANON_KEY=eyJ... (YOUR KEY HERE)" -ForegroundColor White
Write-Host "NODE_ENV=development" -ForegroundColor White
Write-Host ""
Write-Host "4. Run: npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

# Offer to open other useful pages
Write-Host ""
$response = Read-Host "Open SQL Editor for running migrations? (y/n)"
if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Host "Opening SQL Editor..." -ForegroundColor Green
    Start-Process "https://supabase.com/dashboard/project/xnijhggwgbxrtvlktviz/editor"
}

Write-Host ""
$response = Read-Host "Open Table Editor? (y/n)"
if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Host "Opening Table Editor..." -ForegroundColor Green
    Start-Process "https://supabase.com/dashboard/project/xnijhggwgbxrtvlktviz/editor"
}

Write-Host ""
Write-Host "Done! Check the opened browser tabs." -ForegroundColor Green
Write-Host "Need help? Read: scripts/migrate-to-new-database.md" -ForegroundColor Cyan
Write-Host ""

