import FileUpload from '../FileUpload';

interface SaaSExpenseUploaderProps {
  onUploaded?: (data: { key: string; publicUrl?: string; path?: string }) => void;
}

export default function SaaSExpenseUploader({ onUploaded }: SaaSExpenseUploaderProps) {
  return (
    <FileUpload
      pathPrefix="saas-expenses"
      bucket="uploads"
      accept=".csv,.xlsx,.xls"
      label="Upload SaaS Expense Report"
      onUploaded={onUploaded}
    />
  );
}
