import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import type { Customer } from '@/types/customer';

export type ExportFormat = 'csv' | 'json';

export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  includeHeaders?: boolean;
}

const formatCustomerForExport = (customer: Customer) => ({
  'Customer ID': customer.user_id,
  'Full Name': customer.full_name,
  'Email': customer.email || '',
  'Phone': customer.phone || '',
  'Delivery Address': customer.delivery_address || '',
  'City': customer.city || '',
  'Postal Code': customer.postal_code || '',
  'County': customer.county || '',
  'Total Orders': customer.total_orders,
  'Total Spent (£)': customer.total_spent.toFixed(2),
  'Last Order Date': customer.last_order_date 
    ? new Date(customer.last_order_date).toLocaleDateString()
    : 'Never',
  'Member Since': new Date(customer.created_at).toLocaleDateString(),
  'Delivery Instructions': customer.delivery_instructions || '',
});

export const exportCustomers = async (
  customers: Customer[], 
  options: ExportOptions = { format: 'csv' }
): Promise<void> => {
  if (customers.length === 0) {
    throw new Error('No customers to export');
  }

  const { format, filename, includeHeaders = true } = options;
  const timestamp = new Date().toISOString().split('T')[0];
  const defaultFilename = `customers-export-${timestamp}`;

  try {
    const formattedData = customers.map(formatCustomerForExport);

    switch (format) {
      case 'csv':
        const csv = Papa.unparse(formattedData, {
          header: includeHeaders,
          delimiter: ',',
        });
        
        const csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(csvBlob, `${filename || defaultFilename}.csv`);
        break;

      case 'json':
        const jsonData = JSON.stringify(formattedData, null, 2);
        const jsonBlob = new Blob([jsonData], { type: 'application/json;charset=utf-8;' });
        saveAs(jsonBlob, `${filename || defaultFilename}.json`);
        break;

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  } catch (error) {
    console.error('Export failed:', error);
    throw new Error('Failed to export customer data');
  }
};

export const exportCustomerStats = async (
  stats: any,
  options: ExportOptions = { format: 'csv' }
): Promise<void> => {
  const { format, filename } = options;
  const timestamp = new Date().toISOString().split('T')[0];
  const defaultFilename = `customer-stats-${timestamp}`;

  const statsData = [
    { Metric: 'Total Customers', Value: stats.total },
    { Metric: 'Active Customers', Value: stats.activeCustomers },
    { Metric: 'Customers with Orders', Value: stats.withOrders },
    { Metric: 'Total Revenue (£)', Value: stats.totalRevenue.toFixed(2) },
    { Metric: 'Average Order Value (£)', Value: stats.averageOrderValue.toFixed(2) },
  ];

  try {
    switch (format) {
      case 'csv':
        const csv = Papa.unparse(statsData);
        const csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(csvBlob, `${filename || defaultFilename}.csv`);
        break;

      case 'json':
        const jsonData = JSON.stringify(statsData, null, 2);
        const jsonBlob = new Blob([jsonData], { type: 'application/json;charset=utf-8;' });
        saveAs(jsonBlob, `${filename || defaultFilename}.json`);
        break;
    }
  } catch (error) {
    console.error('Stats export failed:', error);
    throw new Error('Failed to export customer statistics');
  }
};