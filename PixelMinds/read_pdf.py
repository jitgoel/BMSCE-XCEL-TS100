import pdfplumber

pdf = pdfplumber.open(r"d:\PixelMinds\Onboarding Questions.pdf")
with open(r"d:\PixelMinds\pdf_content.txt", "w", encoding="utf-8") as f:
    for i, page in enumerate(pdf.pages):
        f.write(f"--- PAGE {i+1} ---\n")
        text = page.extract_text()
        if text:
            f.write(text + "\n")
        else:
            f.write("[No text extracted]\n")
        f.write("\n")
pdf.close()
print("Done. Written to pdf_content.txt")
