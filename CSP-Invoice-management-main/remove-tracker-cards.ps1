$path = "app\tracker\page.tsx"

$content = Get-Content $path -Raw

# Remove Transactions card
$transactionsPattern = '(?s)\s*<div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0\.5 hover:shadow-md">\s*<div className="flex items-center justify-between">\s*<p className="text-sm font-semibold text-gray-500">\s*Transactions\s*</p>.*?</div>\s*</div>'

$content = [regex]::Replace($content, $transactionsPattern, "", 1)

# Remove Revenue card
$revenuePattern = '(?s)\s*<div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0\.5 hover:shadow-md">\s*<div className="flex items-center justify-between">\s*<p className="text-sm font-semibold text-gray-500">\s*Revenue\s*</p>.*?</div>\s*</div>'

$content = [regex]::Replace($content, $revenuePattern, "", 1)

# Remove P/L card
$profitPattern = '(?s)\s*<div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0\.5 hover:shadow-md">\s*<div className="flex items-center justify-between">\s*<p className="text-sm font-semibold text-gray-500">\s*P/L\s*</p>.*?</div>\s*</div>'

$content = [regex]::Replace($content, $profitPattern, "", 1)

# Remove unused calculations
$content = [regex]::Replace(
    $content,
    '(?s)\r?\n\s*const totalRevenue = filteredTransactions\.reduce\(.*?\);',
    ""
)

$content = [regex]::Replace(
    $content,
    '(?s)\r?\n\s*const totalProfit = filteredTransactions\.reduce\(.*?\);',
    ""
)

Set-Content -Path $path -Value $content -Encoding UTF8

Write-Host ""
Write-Host "Tracker summary cards updated." -ForegroundColor Green
Write-Host "Quantity card and Add Transaction were kept." -ForegroundColor Green