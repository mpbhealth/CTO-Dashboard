import { Headphones } from 'lucide-react';
import { CEODepartmentDetail } from './CEODepartmentDetail';

export function CEODepartmentSaudeMAX() {
  return (
    <CEODepartmentDetail
      department="saudemax"
      title="SaudeMAX"
      description="Member enrollment and engagement data"
      icon={Headphones}
      color="text-purple-600"
      gradient="from-purple-500 to-purple-600"
    />
  );
}
