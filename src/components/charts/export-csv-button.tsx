"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { rowsToCsv } from "@/lib/services/csv";

interface ExportCsvButtonProps {
  filename: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
}

export function ExportCsvButton({ filename, headers, rows }: ExportCsvButtonProps) {
  function handleExport() {
    const csv = rowsToCsv(headers, rows);
    // BOM (﻿) evita acento quebrado ao abrir no Excel.
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
      <Download className="h-3.5 w-3.5" />
      Exportar CSV
    </Button>
  );
}
