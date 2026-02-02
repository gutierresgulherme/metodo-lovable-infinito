# PowerShell helper to create a branch, commit all changes, push and open a PR (if 'gh' CLI available)
# Usage (from project root):
#   pwsh .\scripts\publish_changes.ps1 -BranchName "feat/local-preview-fixes" -CommitMsg "chore: ..."

param(
    [string]$BranchName = $("feat/local-preview-fixes-" + (Get-Date -Format "yyyyMMddHHmmss")),
    [string]$CommitMsg = "chore: ajustar preview host e preparar melhorias UI"
)

Write-Host "Branch: $BranchName" -ForegroundColor Cyan
Write-Host "Commit message: $CommitMsg" -ForegroundColor Cyan

# Ensure we are in a git repo
if (-not (Test-Path .git)) {
    Write-Error "This script must be run from the project root (where .git/ exists)."
    exit 1
}

# Check for uncommitted changes
$status = git status --porcelain
if (-not $status) {
    Write-Host "No local changes to commit." -ForegroundColor Yellow
    exit 0
}

# Create branch and switch
Write-Host "Creating and switching to branch $BranchName..."
git checkout -b $BranchName

# Stage all changes
Write-Host "Staging changes..."
git add .

# Commit
Write-Host "Creating commit..."
git commit -m "$CommitMsg"

# Push
Write-Host "Pushing branch to origin..."
git push -u origin $BranchName

# Attempt to create PR if gh is installed
$ghExists = (Get-Command gh -ErrorAction SilentlyContinue) -ne $null
if ($ghExists) {
    Write-Host "'gh' detected. Creating PR (interactive mode)..." -ForegroundColor Green
    gh pr create --title "$CommitMsg" --body "Automated PR created from VS Code via helper script." --base master
    Write-Host "PR created (open the link above)." -ForegroundColor Green
} else {
    Write-Host "'gh' CLI not found. Open a PR manually on GitHub or install 'gh' to automate this step." -ForegroundColor Yellow
}

Write-Host "Done. If Vercel is connected to this repo, a deploy will start after PR or merge to the target branch." -ForegroundColor Green
