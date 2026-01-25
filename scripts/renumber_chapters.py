import os
import re

target_dir = "c:/DevOps/Desarrollos/markdownBookshelf/public/novels/la-mancha-de-calcio/md"

if not os.path.exists(target_dir):
    print(f"Directory not found: {target_dir}")
    exit(1)

# Range 10 to 19 inclusive
start_chap = 10
end_chap = 19

count = 0

# Iterate sequentially from 10 to 19 so 10 fills empty 9 slot, then 11 fills empty 10 slot...
for current_num in range(start_chap, end_chap + 1):
    new_num = current_num - 1
    
    # regex to match filenames like cap-tulo-10-segmento-1.md
    # Note: user has files like cap-tulo-6-segmento-1-r.md, but specific request was for 10-19 which seem standard in the list
    # The file list showed standard names for 10-19.
    
    # We accept loose matching on segments
    files = [f for f in os.listdir(target_dir) if f.startswith(f"cap-tulo-{current_num}-segmento-") and f.endswith(".md")]
    
    for filename in files:
        old_path = os.path.join(target_dir, filename)
        
        # Construct new filename
        # Replace only the chapter number part of the filename
        # cap-tulo-10-... -> cap-tulo-9-...
        new_filename = filename.replace(f"cap-tulo-{current_num}-", f"cap-tulo-{new_num}-", 1)
        new_path = os.path.join(target_dir, new_filename)
        
        try:
            with open(old_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            # Update content header: ## CAPÍTULO 10: -> ## CAPÍTULO 9:
            # Using regex to ensure we catch variations
            pattern = re.compile(rf"## CAPÍTULO {current_num}:")
            replacement = f"## CAPÍTULO {new_num}:"
            
            if pattern.search(content):
                new_content = pattern.sub(replacement, content)
            else:
                print(f"Warning: Header '## CAPÍTULO {current_num}:' not found in {filename}. Moving file anyway.")
                new_content = content

            with open(new_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            
            os.remove(old_path)
            print(f"Renumbered: {filename} -> {new_filename}")
            count += 1
            
        except Exception as e:
            print(f"Error processing {filename}: {e}")

print(f"Finished. Renumbered {count} files.")
