import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportColumn {
    header: string;
    key: string;
    width?: number;
}

interface ExportOptions {
    filename: string;
    title?: string;
    columns: ExportColumn[];
    data: Record<string, any>[];
}

/**
 * Export data to Excel file
 */
export const exportToExcel = ({ filename, title, columns, data }: ExportOptions) => {
    // Prepare data for Excel
    const excelData = data.map((row) => {
        const rowData: Record<string, any> = {};
        columns.forEach((col) => {
            rowData[col.header] = row[col.key] ?? '';
        });
        return rowData;
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = columns.map((col) => ({ wch: col.width || 15 }));
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, title || 'Sheet1');

    // Save file
    XLSX.writeFile(wb, `${filename}.xlsx`);
};

/**
 * Export data to PDF file
 */
export const exportToPDF = ({ filename, title, columns, data }: ExportOptions) => {
    // Create PDF document
    const doc = new jsPDF();

    // Add title
    if (title) {
        doc.setFontSize(16);
        doc.text(title, 14, 22);
    }

    // Prepare table data
    const headers = columns.map((col) => col.header);
    const rows = data.map((row) => columns.map((col) => row[col.key] ?? ''));

    // Add table
    autoTable(doc, {
        head: [headers],
        body: rows,
        startY: title ? 30 : 20,
        styles: {
            fontSize: 10,
            cellPadding: 3,
        },
        headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold',
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245],
        },
    });

    // Save file
    doc.save(`${filename}.pdf`);
};

/**
 * Format number as currency
 */
export const formatCurrency = (value: number): string => {
    return `฿${value.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Format date for export
 */
export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

/**
 * Format datetime for export
 */
export const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};
