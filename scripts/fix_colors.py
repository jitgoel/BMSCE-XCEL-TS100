import sys
import os

filename = os.path.join("frontend", "analysis.html")

print(f"Opening {filename}")

with open(filename, "r", encoding="utf-8") as f:
    content = f.read()

target_str = '<div id="printable-resume"'
start_idx = content.find(target_str)

if start_idx != -1:
    end_idx = content.find("</div>`;", start_idx) + len("</div>`;")
    block = content[start_idx:end_idx]

    # Replace hardcoded text colors with CSS variables mapped for dark mode
    block = block.replace("color:#111", "color:var(--fg)")
    block = block.replace("color:#333", "color:var(--fg)")
    block = block.replace("color:#555", "color:var(--fg2)")
    block = block.replace("color:#666", "color:var(--fg2)")
    block = block.replace("color:#8b5cf6", "color:var(--p1)")
    block = block.replace("border-bottom:1px solid #ddd", "border-bottom:1px solid var(--bdr)")
    block = block.replace("border-bottom:2px solid #8b5cf6", "border-bottom:2px solid var(--p1)")

    new_content = content[:start_idx] + block + content[end_idx:]

    with open(filename, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("CSS Variables Successfully Applied to Resume HTML")
else:
    print("Could not find the printable-resume section")
