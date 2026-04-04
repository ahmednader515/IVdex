import fontkit from "@pdf-lib/fontkit";
import { readFile } from "fs/promises";
import path from "path";
import { PDFDocument, rgb } from "pdf-lib";

const certificateFontsDir = path.join(process.cwd(), "lib", "certificate-fonts");

type CertificatePayload = {
  studentName: string;
  courseName: string;
  issuedAt: Date;
};

function sanitizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** dd/mm/yyyy (numeric), zero-padded */
function formatIssuedDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = String(date.getFullYear());
  return `${d}/${m}/${y}`;
}

function containsArabicScript(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
}

/**
 * Layout calibrated to "IVDex Certificate with name.pdf" (same page size as the blank template).
 * PDF origin: bottom-left. Template already includes static lines ("Presented By…", "For Successfully…").
 */
export async function generateCertificatePdf(payload: CertificatePayload): Promise<Uint8Array> {
  const templatePath = path.join(process.cwd(), "public", "IVDex Certificate Temp.pdf");
  const templateBytes = await readFile(templatePath);

  const pdf = await PDFDocument.load(templateBytes);
  pdf.registerFontkit(fontkit);

  const [arabicBoldBytes, arabicRegularBytes, latinBoldBytes, latinRegularBytes] = await Promise.all([
    readFile(path.join(certificateFontsDir, "NotoSansArabic-Bold.ttf")),
    readFile(path.join(certificateFontsDir, "NotoSansArabic-Regular.ttf")),
    readFile(path.join(certificateFontsDir, "NotoSans-Bold.ttf")),
    readFile(path.join(certificateFontsDir, "NotoSans-Regular.ttf")),
  ]);

  const arabicBoldFont = await pdf.embedFont(arabicBoldBytes);
  const arabicRegularFont = await pdf.embedFont(arabicRegularBytes);
  const latinBoldFont = await pdf.embedFont(latinBoldBytes);
  const latinRegularFont = await pdf.embedFont(latinRegularBytes);

  const page = pdf.getPages()[0];
  const { width } = page.getSize();

  const safeStudentName = sanitizeText(payload.studentName);
  const safeCourseName = sanitizeText(payload.courseName);
  const dateText = formatIssuedDate(payload.issuedAt);

  const studentFont = containsArabicScript(safeStudentName) ? arabicBoldFont : latinBoldFont;
  const courseFont = containsArabicScript(safeCourseName) ? arabicRegularFont : latinRegularFont;
  const dateFont = latinRegularFont;

  const studentFontSize = 30;
  const courseFontSize = 30;
  const dateFontSize = 15;

  const studentY = 274;
  const courseY = 158;
  const dateY = 80.71;
  /** Right edge of printed date, aligned with reference PDF (~491 start for ~65pt-wide string). */
  const dateAreaRight = 555;

  const studentTextWidth = studentFont.widthOfTextAtSize(safeStudentName, studentFontSize);
  const courseTextWidth = courseFont.widthOfTextAtSize(safeCourseName, courseFontSize);
  const dateTextWidth = dateFont.widthOfTextAtSize(dateText, dateFontSize);

  page.drawText(safeStudentName, {
    x: (width - studentTextWidth) / 2,
    y: studentY,
    size: studentFontSize,
    font: studentFont,
    color: rgb(0.1, 0.24, 0.45),
  });

  page.drawText(safeCourseName, {
    x: (width - courseTextWidth) / 2,
    y: courseY,
    size: courseFontSize,
    font: courseFont,
    color: rgb(0.12, 0.12, 0.12),
  });

  page.drawText(dateText, {
    x: Math.max(48, dateAreaRight - dateTextWidth),
    y: dateY,
    size: dateFontSize,
    font: dateFont,
    color: rgb(0.2, 0.2, 0.2),
  });

  return pdf.save();
}
