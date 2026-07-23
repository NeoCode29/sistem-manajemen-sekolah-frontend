import api from './axios';

// 1. Payment Types
export interface PaymentType {
  id: string;
  code: string;
  name: string;
  defaultAmount: number;
  isRecurring: boolean;
  description?: string;
}

export const getPaymentTypes = async (): Promise<PaymentType[]> => {
  const response = await api.get('/finance/payment-types');
  return response.data;
};

export const createPaymentType = async (data: Partial<PaymentType>) => {
  const response = await api.post('/finance/payment-types', data);
  return response.data;
};

export const updatePaymentType = async (id: string, data: Partial<PaymentType>) => {
  const response = await api.patch(`/finance/payment-types/${id}`, data);
  return response.data;
};

export const deletePaymentType = async (id: string) => {
  await api.delete(`/finance/payment-types/${id}`);
};

// 2. Payment Periods
export interface PaymentPeriod {
  id: string;
  paymentTypeId: string;
  academicYearId: string;
  semesterId: string;
  month?: number;
  year?: number;
  title: string;
  dueDate: string;
  paymentType?: PaymentType;
}

export const getPaymentPeriods = async (params?: Record<string, any>): Promise<PaymentPeriod[]> => {
  const response = await api.get('/finance/payment-periods', { params });
  return response.data;
};

export const createPaymentPeriod = async (data: Partial<PaymentPeriod>) => {
  const response = await api.post('/finance/payment-periods', data);
  return response.data;
};

export const updatePaymentPeriod = async (id: string, data: Partial<PaymentPeriod>) => {
  const response = await api.patch(`/finance/payment-periods/${id}`, data);
  return response.data;
};

export const deletePaymentPeriod = async (id: string) => {
  await api.delete(`/finance/payment-periods/${id}`);
};

// 3. Billings
export interface StudentBilling {
  id: string;
  studentId: string;
  paymentTypeId: string;
  paymentPeriodId?: string;
  amount: number;
  discountAmount: number;
  discountReason?: string;
  remainingAmount: number;
  status: string; // "UNPAID" | "PARTIAL" | "PAID" | "CANCELLED"
  dueDate?: string;
  notes?: string;
  student?: any;
  paymentType?: PaymentType;
  paymentPeriod?: PaymentPeriod;
  payments?: StudentPayment[];
}

export const getBillings = async (params?: Record<string, any>): Promise<{ data: StudentBilling[], meta: any }> => {
  const response = await api.get('/finance/billings', { params });
  return response.data; // Assuming pagination
};

export const generateBatchBillings = async (payload: { paymentPeriodId: string; gradeId?: string; classroomId?: string; dueDate: string; }) => {
  const response = await api.post('/finance/billings/generate', payload);
  return response.data; // { totalTargetStudents, generatedCount, skippedCount }
};

export const createCustomBilling = async (data: Partial<StudentBilling>) => {
  const response = await api.post('/finance/billings/custom', data);
  return response.data;
};

export const updateBilling = async (id: string, data: Partial<StudentBilling>) => {
  const response = await api.patch(`/finance/billings/${id}`, data);
  return response.data;
};

export const cancelBilling = async (id: string) => {
  const response = await api.patch(`/finance/billings/${id}/cancel`);
  return response.data;
};

// 4. Payments & Receipts
export interface StudentPayment {
  id: string;
  receiptId: string;
  billingId: string;
  amountPaid: number;
  createdAt: string;
  billing?: StudentBilling;
}

export interface PaymentReceipt {
  id: string;
  receiptNumber: string;
  studentId: string;
  totalAmount: number;
  paymentMethod: string;
  paymentDate: string;
  notes?: string;
  recordedBy?: string;
  details?: StudentPayment[];
  student?: any;
}

export const checkoutPayments = async (payload: { studentId: string; paymentMethod: string; notes?: string; items: { billingId: string; amountPaid: number }[] }) => {
  const response = await api.post('/finance/payments/checkout', payload);
  return response.data;
};

export const getReceipts = async (params?: Record<string, any>): Promise<{ data: PaymentReceipt[], meta: any }> => {
  const response = await api.get('/finance/receipts', { params });
  return response.data;
};

export const getReceiptById = async (id: string): Promise<PaymentReceipt> => {
  const response = await api.get(`/finance/receipts/${id}`);
  return response.data;
};

export const getReceiptPdfUrl = (id: string) => {
  return `${api.defaults.baseURL}/finance/receipts/${id}/pdf`;
};
