"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

function filenameFromContentDisposition(header: string | null): string | undefined {
  if (!header) return undefined;
  const utf8 = /filename\*=(?:UTF-8''|utf-8'')([^;]+)/i.exec(header);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1].trim().replace(/^["']|["']$/g, ""));
    } catch {
      /* fall through */
    }
  }
  const quoted = /filename="([^"]+)"/i.exec(header);
  if (quoted?.[1]) return quoted[1].trim();
  const plain = /filename=([^;\s]+)/i.exec(header);
  if (plain?.[1]) return plain[1].trim().replace(/^["']|["']$/g, "");
  return undefined;
}

export type QuizCertificateDownloadButtonProps = {
  courseId: string;
  quizId: string;
  label?: string;
} & Omit<ButtonProps, "onClick" | "disabled" | "type">;

export function QuizCertificateDownloadButton({
  courseId,
  quizId,
  label = "Download PDF",
  variant = "outline",
  size = "default",
  className,
  children,
  ...rest
}: QuizCertificateDownloadButtonProps) {
  const [busy, setBusy] = useState(false);

  const handleDownload = async () => {
    setBusy(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/quizzes/${quizId}/certificate`, {
        credentials: "same-origin",
      });
      if (!response.ok) return;
      const buf = await response.arrayBuffer();
      if (!buf.byteLength) return;
      const blob = new Blob([buf], { type: "application/pdf" });
      const headerName = filenameFromContentDisposition(response.headers.get("Content-Disposition"));
      let fileName = headerName ?? `IVDex-certificate-${quizId.slice(0, 8)}.pdf`;
      if (!fileName.toLowerCase().endsWith(".pdf")) {
        fileName = `${fileName.replace(/\.[^.]+$/, "")}.pdf`;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={busy}
      onClick={handleDownload}
      {...rest}
    >
      {children ?? (
        <>
          <Download className="mr-2 h-4 w-4" />
          {busy ? "Downloading…" : label}
        </>
      )}
    </Button>
  );
}
