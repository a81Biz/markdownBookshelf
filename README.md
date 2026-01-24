# 📚 MB | Markdown Bookshelf

**MB** es un ecosistema de lectura digital minimalista y elegante diseñado para transformar archivos Markdown simples en una experiencia de lectura inmersiva. Aloja y lee tus novelas (como *Valdoria*, *Castigo* o *El Sol Llegó Tarde*) directamente desde la web, con un enfoque total en la tipografía y la legibilidad.

Visualizable en: [a81.biz/MB/](https://www.google.com/search?q=https://a81.biz/MB/)

## ✨ Características Principales

* **Lectura Inmersiva:** Interfaz limpia inspirada en dispositivos Kindle y Medium.
* **Modos de Lectura:** Soporte nativo para modo **Día**, **Sepia** y **Noche**.
* **Lectura en Voz Alta (TTS):** Botón integrado que utiliza la Web Speech API para narrar tus capítulos.
* **Sin Backend:** Funciona 100% como una Single Page Application (SPA) sobre GitHub Pages.
* **Gestión Simple:** Solo añade tus archivos `.md` y el sistema se encarga del resto.

## 🚀 Estructura del Proyecto

El sistema se basa en una jerarquía de archivos JSON para el descubrimiento de contenido:

```text
/ (root)
├── index.html          # Aplicación principal (React + Tailwind)
├── library.json        # Índice maestro de todas las novelas
└── novelas/
    └── el-sol-llego-tarde/
        ├── index.json  # Índice de capítulos de esta novela
        ├── portada.jpg # Imagen de portada generada por IA
        └── md/         # Carpeta con los archivos .md reales

```

## 🛠️ Automatización (PowerShell)

Para mantener tus novelas actualizadas sin escribir JSON manualmente, utiliza el script incluido:

1. Coloca tus archivos en la carpeta `md/`.
2. Ejecuta `.\generate_index.ps1`.
3. El script detectará tus capítulos (usando orden natural: 7 viene antes de 10) y extraerá los títulos directamente de tus encabezados `###`.

## 📦 Despliegue en a81.biz

Este proyecto se despliega automáticamente mediante **GitHub Actions**. El flujo de trabajo clona el contenido y lo posiciona bajo la ruta `/MB/` para mantener una URL corta y limpia:

```yaml
- name: Copy Content
  run: |
    mkdir -p build/MB
    cp -R mb-temp/* build/MB/

```

## ✒️ Autor

**Alberto Martínez** - Desarrollador y escritor de universos como *Valdoria* y *Castigo*.

