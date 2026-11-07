export interface ExcelColumn<T> {
  header: string;
  width?: number;
  value: (row: T, index: number) => string | number | null | undefined;
}

export interface ExcelSheet<T = unknown> {
  name: string;
  title?: string;
  subtitle?: string;
  columns: ExcelColumn<T>[];
  rows: T[];
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function sanitizeSheetName(name: string): string {
  const cleaned = name.replace(/[\\/?*[\]:]/g, " ").trim();
  return (cleaned || "Sheet1").slice(0, 31);
}

/**
 * Generates a native Microsoft Excel SpreadsheetML (.xls) workbook with UTF-8 BOM,
 * full Vietnamese typography support, styled header rows, and auto-sized column widths.
 */
export function downloadExcelWorkbook(
  filename: string,
  sheets: ExcelSheet<any>[],
): void {
  const worksheetsXml = sheets
    .map((sheet) => {
      const sheetName = escapeXml(sanitizeSheetName(sheet.name));
      const colsXml = sheet.columns
        .map(
          (col) =>
            `<Column ss:AutoFitWidth="1" ss:Width="${col.width ?? 140}"/>`,
        )
        .join("");

      const colCount = Math.max(sheet.columns.length, 1);
      const titleRowsXml: string[] = [];

      if (sheet.title) {
        titleRowsXml.push(
          `<Row ss:Height="28"><Cell ss:MergeAcross="${colCount - 1}" ss:StyleID="Title"><Data ss:Type="String">${escapeXml(sheet.title)}</Data></Cell></Row>`,
        );
      }
      if (sheet.subtitle) {
        titleRowsXml.push(
          `<Row ss:Height="20"><Cell ss:MergeAcross="${colCount - 1}" ss:StyleID="Subtitle"><Data ss:Type="String">${escapeXml(sheet.subtitle)}</Data></Cell></Row>`,
        );
      }
      if (titleRowsXml.length > 0) {
        titleRowsXml.push(`<Row ss:Height="10"/>`);
      }

      const headerXml = `<Row ss:Height="24">${sheet.columns
        .map(
          (col) =>
            `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(col.header)}</Data></Cell>`,
        )
        .join("")}</Row>`;

      const dataRowsXml = sheet.rows
        .map((row, rowIndex) => {
          const cellsXml = sheet.columns
            .map((col) => {
              const raw = col.value(row, rowIndex);
              if (raw === null || raw === undefined || raw === "") {
                return `<Cell ss:StyleID="Cell"><Data ss:Type="String">—</Data></Cell>`;
              }
              if (typeof raw === "number" && Number.isFinite(raw)) {
                return `<Cell ss:StyleID="NumberCell"><Data ss:Type="Number">${raw}</Data></Cell>`;
              }
              return `<Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(String(raw))}</Data></Cell>`;
            })
            .join("");
          return `<Row ss:Height="20">${cellsXml}</Row>`;
        })
        .join("");

      return `<Worksheet ss:Name="${sheetName}"><Table>${colsXml}${titleRowsXml.join("")}${headerXml}${dataRowsXml}</Table></Worksheet>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Arial" ss:Size="10" ss:Color="#0F172A"/>
  </Style>
  <Style ss:ID="Title">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Arial" ss:Size="13" ss:Bold="1" ss:Color="#005C5F"/>
  </Style>
  <Style ss:ID="Subtitle">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Arial" ss:Size="10" ss:Italic="1" ss:Color="#475569"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Arial" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#00878A" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Cell">
   <Alignment ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="NumberCell">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
 </Styles>
 ${worksheetsXml}
</Workbook>`;

  const blob = new Blob(["\uFEFF", xml], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".xls") ? filename : `${filename}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
