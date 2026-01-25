import os

target_dir = "c:/DevOps/Desarrollos/markdownBookshelf/public/novels/la-mancha-de-calcio/md"

if not os.path.exists(target_dir):
    print(f"Directory not found: {target_dir}")
    exit(1)

count = 0
for filename in os.listdir(target_dir):
    if filename.endswith(".md"):
        filepath = os.path.join(target_dir, filename)
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            
            if "### SEGMENTO" in content:
                new_content = content.replace("### SEGMENTO", "### PARTE")
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Updated: {filename}")
                count += 1
        except Exception as e:
            print(f"Error processing {filename}: {e}")

print(f"Finished. Updated {count} files.")
