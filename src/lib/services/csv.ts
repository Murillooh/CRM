/**
 * Geração de CSV pra exportação dos Relatórios. Função pura — o componente client
 * só chama isso e dispara o download (Blob), sem lib externa.
 */
export function rowsToCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escape = (value: string | number | null | undefined): string => {
    const str = value == null ? "" : String(value);
    // Precisa entre aspas se tiver vírgula, aspas ou quebra de linha; aspas internas dobram (padrão RFC 4180).
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [headers.map(escape).join(","), ...rows.map((row) => row.map(escape).join(","))];
  return lines.join("\r\n");
}
