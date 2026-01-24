import json
import re
import os

KEYWORDS = {
    'bloque': 'BLOQUE',
    'capitulo': 'CAPÍTULO',
    'segmento': 'SEGMENTO',
}

ROMAN_NUMERALS = {
    'i': 'I', 'ii': 'II', 'iii': 'III', 'iv': 'IV', 'v': 'V', 
    'vi': 'VI', 'vii': 'VII', 'viii': 'VIII', 'ix': 'IX', 'x': 'X'
}

def parse_filename(filename):
    # format: md/bloque-i-capitulo-1-segmento-1.md
    basename = os.path.basename(filename)
    match = re.match(r'bloque-([a-z]+)-capitulo-([\d\.\-]+)-segmento-(.*)\.md', basename)
    if match:
        act_roman = match.group(1)
        act_roman = ROMAN_NUMERALS.get(act_roman, act_roman.upper())
        
        chap_num = match.group(2).replace('-', '.')
        seg_num = match.group(3).replace('-', ' ')
        
        return {
            "act": f"BLOQUE {act_roman}",
            "chapter": f"CAPÍTULO {chap_num}",
            "segment": f"SEGMENTO {seg_num}"
        }
    return None

def parse_title(title):
    # Format: TEXTO NARRATIVO: BLOQUE I, CAPÍTULO 1, SEGMENTO 1 (APERTURA)
    # Regex designed to be flexible
    match = re.search(r'(BLOQUE [IVX]+)[,:]?\s*(CAPÍTULO [\d\.]+)[,:]?\s*(SEGMENTO .*)', title, re.IGNORECASE)
    if match:
        return {
            "act": match.group(1).strip().upper(),
            "chapter": match.group(2).strip().upper(),
            "segment": match.group(3).strip().upper() # Keep formatting if possible, or upper it
        }
    
    # Try handling "BLOQUE VI — UNIÓN + BATALLA ÉPICA"
    match_bloque_only = re.match(r'(BLOQUE [IVX]+)\s*[—\-]\s*(.*)', title, re.IGNORECASE)
    if match_bloque_only:
        return {
            "act": match_bloque_only.group(1).strip().upper(),
            "chapter": match_bloque_only.group(2).strip(), # Treat the rest as chapter title?
            "segment": ""
        }

    return None

def migrate():
    path = r'c:\DevOps\Desarrollos\markdownBookshelf\public\novels\el-sol-llego-tarde\index.json'
    
    try:
        # Try utf-8-sig first to handle BOM
        with open(path, 'r', encoding='utf-8-sig') as f:
            data = json.load(f)
    except json.JSONDecodeError:
        # Fallback to utf-16 if necessary, though unlikely for simple json
        with open(path, 'r', encoding='utf-16') as f:
            data = json.load(f)

    for chapter in data.get('chapters', []):
        parsed = parse_title(chapter['title'])
        
        if not parsed:
             # Fallback to filename parsing if title parsing fails or title is filename
            parsed = parse_filename(chapter['file'])
        
        if parsed:
            chapter['act'] = parsed['act']
            chapter['chapter'] = parsed['chapter']
            chapter['segment'] = parsed['segment']
        else:
            print(f"Could not parse: {chapter['title']}")
            # Set defaults so frontend doesn't break
            chapter['act'] = ""
            chapter['chapter'] = chapter['title']
            chapter['segment'] = ""

    # Write back as standard utf-8 without BOM if possible, or matches original?
    # Standard JSON usually prefers no BOM.
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    
    print("Migration complete.")

if __name__ == '__main__':
    migrate()
