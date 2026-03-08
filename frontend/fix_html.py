import sys
import os

filename = r"c:\Users\IDREES SHAIKH\Downloads\NewResumeAnalayzer\ResumeAnalyzer-main\frontend\analysis.html"

with open(filename, "r", encoding="utf-8") as f:
    content = f.read()

# Fix the missing template declaration
parts = content.split("// Build the HTML resume")
if len(parts) > 1:
    before = parts[0]
    rest = parts[1]
    
    start_tag = "<div id=\"printable-resume\""
    start_idx = rest.find(start_tag)
    
    if start_idx != -1:
        new_content = before + "// Build the HTML resume\n        const resumeHTML = `\n" + rest[start_idx:]
        
        # Apply the dark mode color variables inside the new content
        new_content = new_content.replace("color:#111", "color:var(--fg)")
        new_content = new_content.replace("color:#333", "color:var(--fg)")
        new_content = new_content.replace("color:#555", "color:var(--fg2)")
        new_content = new_content.replace("color:#666", "color:var(--fg2)")
        new_content = new_content.replace("color:#8b5cf6", "color:var(--p1)")
        new_content = new_content.replace("border-bottom:1px solid #ddd", "border-bottom:1px solid var(--bdr)")

        with open(filename, "w", encoding="utf-8") as f:
            f.write(new_content)
        print("Successfully restored the resumeHTML block and applied dark colors.")
    else:
        print("Could not find the printable-resume div.")
else:
    print("Could not find the comment '// Build the HTML resume'.")
