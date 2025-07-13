import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface ExportData {
  title: string;
  data: any[];
  headers?: string[];
  filename?: string;
}

// CSV Export Function
export const exportToCSV = (data: ExportData) => {
  const { title, data: tableData, headers, filename } = data;
  
  if (!tableData || tableData.length === 0) {
    alert('No data available to export');
    return;
  }

  // Generate headers from first object if not provided
  const csvHeaders = headers || Object.keys(tableData[0]);
  
  // Create CSV content
  const csvContent = [
    csvHeaders.join(','),
    ...tableData.map(row => 
      csvHeaders.map(header => {
        const value = row[header] || '';
        // Escape commas and quotes in values
        return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      }).join(',')
    )
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename || title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// PDF Export Function
export const exportToPDF = (data: ExportData) => {
  const { title, data: tableData, headers, filename } = data;
  
  if (!tableData || tableData.length === 0) {
    alert('No data available to export');
    return;
  }

  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text(title, 20, 20);
  
  // Add date
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
  
  // Generate headers from first object if not provided
  const pdfHeaders = headers || Object.keys(tableData[0]);
  
  // Prepare table data
  const tableRows = tableData.map(row => 
    pdfHeaders.map(header => {
      const value = row[header];
      return value !== null && value !== undefined ? String(value) : '';
    })
  );

  // Add table
  doc.autoTable({
    head: [pdfHeaders],
    body: tableRows,
    startY: 40,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [79, 70, 229], // Indigo color
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Light gray
    },
  });

  // Save the PDF
  doc.save(`${filename || title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};

// Word Document Export Function (using HTML format that Word can open)
export const exportToWord = (data: ExportData) => {
  const { title, data: tableData, headers, filename } = data;
  
  if (!tableData || tableData.length === 0) {
    alert('No data available to export');
    return;
  }

  // Generate headers from first object if not provided
  const wordHeaders = headers || Object.keys(tableData[0]);
  
  // Create HTML content for Word
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #4F46E5; margin-bottom: 10px; }
        .meta { color: #6B7280; font-size: 12px; margin-bottom: 20px; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #D1D5DB; padding: 8px; text-align: left; }
        th { background-color: #4F46E5; color: white; font-weight: bold; }
        tr:nth-child(even) { background-color: #F8FAFC; }
        .footer { margin-top: 20px; font-size: 10px; color: #6B7280; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="meta">Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
      
      <table>
        <thead>
          <tr>
            ${wordHeaders.map(header => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${tableData.map(row => `
            <tr>
              ${wordHeaders.map(header => {
                const value = row[header];
                return `<td>${value !== null && value !== undefined ? String(value) : ''}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        <p>MPB Health Analytics Dashboard - Confidential Report</p>
        <p>Total Records: ${tableData.length}</p>
      </div>
    </body>
    </html>
  `;

  // Create and download file
  const blob = new Blob([htmlContent], { type: 'application/msword' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename || title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.doc`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Combined export function with format selection
export const exportData = (data: ExportData, format: 'csv' | 'pdf' | 'word') => {
  switch (format) {
    case 'csv':
      exportToCSV(data);
      break;
    case 'pdf':
      exportToPDF(data);
      break;
    case 'word':
      exportToWord(data);
      break;
    default:
      console.error('Unsupported export format:', format);
  }
};