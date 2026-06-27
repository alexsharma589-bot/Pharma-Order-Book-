import * as Sharing from 'expo-sharing';
import { Linking } from 'react-native';
import { format } from 'date-fns';
import { Order } from '@/types';

/** Opens the native share sheet for a file (PDF or Excel). WhatsApp will appear
 * in the sheet automatically if it's installed on the device. */
export async function shareFile(uri: string, mimeType?: string): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) throw new Error('Sharing is not available on this device.');
  await Sharing.shareAsync(uri, { mimeType, dialogTitle: 'Share Order' });
}

function buildOrderTextSummary(order: Order): string {
  const lines = (order.items ?? []).map(
    (it, idx) =>
      `${idx + 1}. ${it.productName}${it.strength ? ` (${it.strength})` : ''} - Qty: ${it.quantity}${
        it.freeQuantity ? ` + Free: ${it.freeQuantity}` : ''
      }`
  );
  return [
    `*Pharma Order Book*`,
    `Customer: ${order.customerName}${order.shopName ? ` (${order.shopName})` : ''}`,
    `Date: ${format(order.orderDate, 'dd MMM yyyy')}`,
    ``,
    ...lines,
    ``,
    `Total Items: ${order.totalItems}`,
    order.remarks ? `Remarks: ${order.remarks}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

/** Opens WhatsApp directly with a pre-filled text summary (no attachment - use
 * shareFile() for sending the actual PDF/Excel through the WhatsApp share sheet). */
export async function shareOrderTextToWhatsApp(order: Order, phoneNumber?: string): Promise<void> {
  const text = encodeURIComponent(buildOrderTextSummary(order));
  const url = phoneNumber ? `whatsapp://send?phone=${phoneNumber}&text=${text}` : `whatsapp://send?text=${text}`;
  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) throw new Error('WhatsApp is not installed on this device.');
  await Linking.openURL(url);
}
