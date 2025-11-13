import CsvUploader from './CsvUploader';

interface SaaSExpenseUploaderProps {
  onUpload: (file: File) => Promise<void> | void;
  className?: string;
}

export default function SaaSExpenseUploader({
  onUpload,
  className,
}: SaaSExpenseUploaderProps) {
  return (
    <CsvUploader
      onUpload={onUpload}
      accept=".csv"
      maxSize={5 * 1024 * 1024}
      className={className}
    />
  );
}
