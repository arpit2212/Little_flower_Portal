import zipfile
import re
import os

docx_path = r"src\example_marksheet\1 MS - Copy.docx"

if not os.path.exists(docx_path):
    print(f"File not found: {docx_path}")
    exit(1)

try:
    with zipfile.ZipFile(docx_path) as z:
        # Read document.xml for text
        xml_content = z.read("word/document.xml").decode("utf-8")
        
        # Extract text
        text_parts = re.findall(r'<w:t[^>]*>(.*?)</w:t>', xml_content)
        print("--- Document Text Sample ---")
        print("\n".join(text_parts[:50])) # First 50 text items
        
        # Extract colors
        # Look for w:color w:val="HEX" or w:shd w:fill="HEX"
        colors = re.findall(r'w:color w:val="([0-9A-Fa-f]+)"', xml_content)
        fills = re.findall(r'w:shd w:val="[^"]*" w:color="[^"]*" w:fill="([0-9A-Fa-f]+)"', xml_content)
        
        print("\n--- Colors Found (Hex) ---")
        unique_colors = set(colors + fills)
        for c in unique_colors:
            print(f"#{c}")

except Exception as e:
    print(f"Error reading docx: {e}")
