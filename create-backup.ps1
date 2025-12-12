# Script para criar backup do FisioQ Beta
$timestamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
$backupName = "fisioq-backup_$timestamp.zip"
$rootPath = $PSScriptRoot

Write-Host "Criando backup: $backupName" -ForegroundColor Green

# Diretórios e arquivos para excluir
$excludeDirs = @(
    'node_modules',
    'dist',
    '.git',
    'coverage',
    '.vite',
    'build',
    '.next',
    'server/node_modules',
    'mobile-rn/node_modules',
    'mobile-rn/mobile-rn/node_modules'
)

$excludeFiles = @(
    '*.log',
    '*.tmp',
    '.DS_Store',
    'Thumbs.db',
    '*.zip'
)

# Criar lista de arquivos para incluir
$filesToInclude = @()

Get-ChildItem -Path $rootPath -Recurse -File | ForEach-Object {
    $include = $true
    $relativePath = $_.FullName.Substring($rootPath.Length + 1)
    
    # Verificar se está em diretório excluído
    foreach ($excludeDir in $excludeDirs) {
        if ($relativePath -like "$excludeDir\*" -or $relativePath -like "*\$excludeDir\*") {
            $include = $false
            break
        }
    }
    
    # Verificar se é arquivo excluído
    if ($include) {
        foreach ($pattern in $excludeFiles) {
            if ($_.Name -like $pattern) {
                $include = $false
                break
            }
        }
    }
    
    if ($include) {
        $filesToInclude += $_
    }
}

Write-Host "Arquivos a incluir: $($filesToInclude.Count)" -ForegroundColor Yellow

# Criar ZIP
if ($filesToInclude.Count -gt 0) {
    $filesToInclude | Compress-Archive -DestinationPath $backupName -CompressionLevel Optimal -Force
    $fileSize = (Get-Item $backupName).Length / 1MB
    Write-Host "Backup criado com sucesso: $backupName" -ForegroundColor Green
    Write-Host "Tamanho: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Green
} else {
    Write-Host "Nenhum arquivo encontrado para backup" -ForegroundColor Red
}

