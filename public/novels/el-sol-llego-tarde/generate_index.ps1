# 1. Solicitar datos al usuario
$tituloLibro = Read-Host "Introduce el título del libro"
$autorLibro = Read-Host "Introduce el nombre del autor"

# 2. Configurar rutas
$folderPath = "./md"
$outputFile = "index.json"

if (-not (Test-Path $folderPath)) {
    Write-Host "Error: La carpeta /md no existe." -ForegroundColor Red
    exit
}

# 3. Listar archivos .md con ORDEN NATURAL (7 viene antes que 10)
# Usamos un regex para encontrar números y rellenarlos con ceros solo para la comparación
$files = Get-ChildItem -Path $folderPath -Filter *.md | Sort-Object { 
    [regex]::Replace($_.Name, '\d+', { $args[0].Value.PadLeft(10, '0') }) 
}

$chapters = @()

foreach ($file in $files) {
    # 4. Leer el contenido para buscar el título ###
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    
    # Busca la línea que empieza con ###
    if ($content -match '(?m)^###\s*(.*)') {
        $chapterTitle = $matches[1].Trim()
    } else {
        $chapterTitle = $file.Name # Fallback al nombre del archivo
    }

    # Añadir al array de capítulos
    $chapters += [PSCustomObject]@{
        title = $chapterTitle
        file  = "md/$($file.Name)"
    }
}

# 5. Crear objeto final y convertir a JSON
$indexObject = [PSCustomObject]@{
    title    = $tituloLibro
    author   = $autorLibro
    chapters = $chapters
}

# Guardar y sobreescribir con -Force
$indexObject | ConvertTo-Json -Depth 4 | Out-File -FilePath $outputFile -Encoding UTF8 -Force

Write-Host "`n¡Éxito! '$outputFile' generado con orden natural ($($chapters.Count) capítulos)." -ForegroundColor Green