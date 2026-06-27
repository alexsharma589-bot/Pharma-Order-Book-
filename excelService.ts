import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import { format } from 'date-fns';
import { Order } from '@/types';

/** Exports one order's line items to an .xlsx file and returns the local file URI. */
export async function exportOrderToExcel(order: Order): Promise<string> {
  const rows = (order.items ?? []).map((it, idx) => ({
    '#': idx + 1,
    Product: it.productName,
    Strength: it.strength ?? '',
    Packing: it.packing ?? '',
    Quantity: it.quantity,
    'Free Qty': it.freeQuantity,
  }));

  const sheet = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'Order');

  const summarySheet = XLSX.utils.json_to_sheet([
    { Field: 'Customer', Value: order.customerName },
    { Field: 'Shop', Value: order.shopName ?? '' },
    { Field: 'Date', Value: format(order.orderDate, 'dd MMM yyyy') },
    { Field: 'Total Items', Value: order.totalItems },
    { Field: 'Remarks', Value: order.remarks ?? '' },
  ]);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

  const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  const fileName = `order_${order.customerName.replace(/\s+/g, '_')}_${format(order.orderDate, 'yyyyMMdd')}.xlsx`;
  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
  return fileUri;
}

/** Exports a list of orders (e.g. order history / monthly report) to a single .xlsx file. */
export async function exportOrdersListToExcel(orders: Order[]): Promise<string> {
  const rows = orders.map((o) => ({
    Date: format(o.orderDate, 'dd MMM yyyy'),
    Customer: o.customerName,
    Shop: o.shopName ?? '',
    'Total Items': o.totalItems,
    Remarks: o.remarks ?? '',
  }));
  const sheet = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'Orders');

  const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  const fileUri = `${FileSystem.cacheDirectory}orders_export_${Date.now()}.xlsx`;
  await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
  return fileUri;
}
