import json
import re
import os
from collections import OrderedDict

KEYWORDS = {
    'bloque': 'BLOQUE',
    'capitulo': 'CAPÍTULO',
    'segmento': 'SEGMENTO',
}

ROMAN_NUMERALS = {
    'i': 'I', 'ii': 'II', 'iii': 'III', 'iv': 'IV', 'v': 'V', 
    'vi': 'VI', 'vii': 'VII', 'viii': 'VIII', 'ix': 'IX', 'x': 'X'
}

def parse_filename_metadata(filename):
    basename = os.path.basename(filename)
    # Handle both dot and dash separators for chapter numbers if needed, though they seem to use dashes in file keys
    match = re.match(r'bloque-([a-z]+)-capitulo-([\d\.\-]+?)-segmento-(.*?)\.md', basename)
    if match:
        act_roman = match.group(1)
        act_roman = ROMAN_NUMERALS.get(act_roman, act_roman.upper())
        
        chap_raw = match.group(2).replace('-', '.')
        seg_raw = match.group(3).replace('-', ' ')
        
        return {
            "act_key": f"BLOQUE {act_roman}",
            "chap_key": f"CAPÍTULO {chap_raw}",
            "seg_num": seg_raw
        }
    return None

def extract_segment_title(title, seg_num_from_file):
    # Standard: TEXTO NARRATIVO: BLOQUE I, CAPÍTULO 1, SEGMENTO 1 (APERTURA)
    match_std = re.search(r'SEGMENTO\s*[\d\.]+\s*(.*)', title, re.IGNORECASE)
    if match_std:
        # returns "(APERTURA)" or "APERTURA" or similar
        return f"SEGMENTO {seg_num_from_file} {match_std.group(1).strip()}"
    
    # Irregular: BLOQUE VI — UNIÓN + BATALLA ÉPICA
    # If it looks like a description, use it
    if "BLOQUE" in title and ("—" in title or "-" in title):
        parts = re.split(r'[—\-]', title)
        if len(parts) > 1:
            return parts[-1].strip() # "UNIÓN + BATALLA ÉPICA"
            
    # Fallback: Just Segment Number
    return f"SEGMENTO {seg_num_from_file}"

def migrate():
    input_path = r'c:\DevOps\Desarrollos\markdownBookshelf\public\novels\el-sol-llego-tarde\index.raw.json'
    output_path = r'c:\DevOps\Desarrollos\markdownBookshelf\public\novels\el-sol-llego-tarde\index.json'
    
    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # We use a nested structure to coalesce data:
    # acts[act_key] -> { 'act': act_key, 'chapters': { chap_key: { 'chapter': chap_key, 'segments': [] } } }
    # Using python dictionaries to preserve insertion order (Py3.7+)
    
    structure = {} 

    for item in data.get('chapters', []):
        meta = parse_filename_metadata(item['file'])
        
        if not meta:
            # Fallback if filename parsing fails? 
            # Try parsing title? 
            # For this task, assuming filenames are consistent is safer.
            print(f"Skipping unparseable filename: {item['file']}")
            continue

        act_key = meta['act_key']
        chap_key = meta['chap_key']
        
        # Determine segment title
        seg_label = extract_segment_title(item['title'], meta['seg_num'])

        if act_key not in structure:
            structure[act_key] = {
                "act": act_key,
                "chapters": {}
            }
        
        if chap_key not in structure[act_key]['chapters']:
             structure[act_key]['chapters'][chap_key] = {
                 "chapter": chap_key,
                 "segments": []
             }
        
        structure[act_key]['chapters'][chap_key]['segments'].append({
            "segment": seg_label,
            "file": item['file']
        })

    # Transform back to lists
    book_list = []
    for act_key, act_data in structure.items():
        chapters_list = []
        for chap_key, chap_data in act_data['chapters'].items():
            chapters_list.append(chap_data)
        
        book_list.append({
            "act": act_data['act'],
            "chapters": chapters_list
        })

    new_data = {
        "title": data.get("title", ""),
        "author": data.get("author", ""),
        "book": book_list
    }

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(new_data, f, indent=4, ensure_ascii=False)
    
    print("Robust hierarchy migration complete.")

if __name__ == '__main__':
    migrate()
