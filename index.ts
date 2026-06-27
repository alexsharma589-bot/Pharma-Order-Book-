export type ProductCategory =
  | 'Tablets'
  | 'Capsules'
  | 'Syrups'
  | 'Injections'
  | 'Ointments'
  | 'Protein Powders'
  | 'Nutraceuticals'
  | 'Cardiac'
  | 'Diabetic'
  | 'Analgesics'
  | 'Antibiotics'
  | 'Others';

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'Tablets',
  'Capsules',
  'Syrups',
  'Injections',
  'Ointments',
  'Protein Powders',
  'Nutraceuticals',
  'Cardiac',
  'Diabetic',
  'Analgesics',
  'Antibiotics',
  'Others',
];

export interface Product {
  id: string;
  name: string;
  strength?: string;
  packing?: string;
  category: ProductCategory;
  companyName?: string;
  mrp?: number | null;
  createdAt: number;
  updatedAt: number;
  deleted: number; // 0 | 1 soft delete (kept for cloud sync)
  dirty: number; // 0 | 1, needs cloud sync
}

export interface Customer {
  id: string;
  name: string;
  shopName?: string;
  mobile?: string;
  area?: string;
  gstNumber?: string;
  createdAt: number;
  updatedAt: number;
  deleted: number;
  dirty: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string; // denormalized snapshot at order time
  strength?: string;
  packing?: string;
  quantity: number;
  freeQuantity: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string; // denormalized snapshot
  shopName?: string;
  orderDate: number; // epoch ms
  remarks?: string;
  totalItems: number;
  createdAt: number;
  updatedAt: number;
  deleted: number;
  dirty: number;
  items?: OrderItem[];
}
