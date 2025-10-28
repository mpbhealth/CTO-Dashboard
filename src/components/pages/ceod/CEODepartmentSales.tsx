import { ShoppingCart } from 'lucide-react';
import { CEODepartmentDetail } from './CEODepartmentDetail';

export function CEODepartmentSales() {
  return (
    <CEODepartmentDetail
      department="sales"
      title="Sales"
      description="Sales orders and pipeline data"
      icon={ShoppingCart}
      color="text-blue-600"
      gradient="from-blue-500 to-blue-600"
    />
  );
}
