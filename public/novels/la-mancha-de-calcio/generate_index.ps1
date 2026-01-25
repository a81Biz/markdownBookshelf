# 1. Definir la función de ordenación lógica de Windows
$Signature = @'
[DllImport("shlwapi.dll", CharSet = CharSet.Unicode)]
public static extern int StrCmpLogicalW(string s1, string s2);
'@

$Type = Add-Type -MemberDefinition $Signature -Name "Win32Utils" -Namespace "Util" -PassThru

# 2. Solicitar datos al usuario
$tituloLibro = Read-Host "Introduce el título del libro"
$autorLibro = Read-Host "Introduce el nombre del autor"
$esFinal = Read-Host "¿Es versión final estructurada? (S/N)"

$folderPath = "./md"
$outputFile = "index.json"

if (-not (Test-Path $folderPath)) {
    Write-Host "Error: La carpeta /md no existe." -ForegroundColor Red
    exit
}

# 3. Listar archivos .md y ordenar usando la función de Windows
$files = Get-ChildItem -Path $folderPath -Filter *.md | ForEach-Object { $_ } | Sort-Object { $_.Name } # Inicial
# Ordenar la lista usando el método de comparación lógica
[Array]::Sort($files, [System.Comparison[System.IO.FileInfo]]{
    param($x, $y) return [Util.Win32Utils]::StrCmpLogicalW($x.Name, $y.Name)
})

if ($esFinal -eq "S" -or $esFinal -eq "s") {
    # --- MODO VERSIÓN FINAL (BLOQUES > CAPÍTULOS > SEGMENTOS) ---
    $bookStructure = @()

    foreach ($file in $files) {
        $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        
        # Extracción de metadatos usando Regex
        $acto = if ($content -match '(?m)^#\s*(.*)') { $matches[1].Trim() } else { "Bloque Sin Título" }
        $capitulo = if ($content -match '(?m)^##\s*(.*)') { $matches[1].Trim() } else { "Capítulo Sin Título" }
        $segmento = if ($content -match '(?m)^###\s*(.*)') { $matches[1].Trim() } else { "***" }

        # Buscar o crear el Acto/Bloque
        $currentAct = $bookStructure | Where-Object { $_.act -eq $acto }
        if (-not $currentAct) {
            $currentAct = [PSCustomObject]@{ act = $acto; chapters = @() }
            $bookStructure += $currentAct
        }

        # Buscar o crear el Capítulo dentro del Acto
        $currentChapter = $currentAct.chapters | Where-Object { $_.chapter -eq $capitulo }
        if (-not $currentChapter) {
            $currentChapter = [PSCustomObject]@{ chapter = $capitulo; segments = @() }
            $currentAct.chapters += $currentChapter
        }

        # Añadir el segmento
        $currentChapter.segments += [PSCustomObject]@{
            segment = $segmento
            file    = "md/$($file.Name)"
        }
    }

    $indexObject = [PSCustomObject]@{
        title  = $tituloLibro
        author = $autorLibro
        book   = $bookStructure
    }

} else {
    # --- MODO SIMPLE ---
    $chapters = @()
    foreach ($file in $files) {
        $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        $chapterTitle = if ($content -match '(?m)^###\s*(.*)') { $matches[1].Trim() } else { $file.Name }
        $chapters += [PSCustomObject]@{ title = $chapterTitle; file = "md/$($file.Name)" }
    }
    $indexObject = [PSCustomObject]@{ title = $tituloLibro; author = $autorLibro; chapters = $chapters }
}

# 4. Guardar y sobreescribir con profundidad de 10 niveles
$indexObject | ConvertTo-Json -Depth 10 | Out-File -FilePath $outputFile -Encoding UTF8 -Force

Write-Host "`n¡Éxito! '$outputFile' generado con orden lógico corregido ($($files.Count) archivos)." -ForegroundColor Green