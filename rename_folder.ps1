$parentDir = 'D:\projectsing'
$folders = Get-ChildItem -Path $parentDir -Directory | Where-Object { $_.Name -match 'Lite|약' }

if ($folders) {
    $folder = $folders[0]
    $newName = 'YAKcare(su)'
    Rename-Item -Path $folder.FullName -NewName $newName -ErrorAction Stop
    Write-Host "Successfully renamed to: $newName"
    Write-Host "New path: $(Join-Path $folder.Parent.FullName $newName)"
} else {
    Write-Host "Folder not found"
}

