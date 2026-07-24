import React, { useState, useEffect } from 'react';
import { getStudents, type Student } from '../../api/studentService';
import { getBillings, checkoutPayments, type StudentBilling } from '../../api/financeService';
import { ShoppingCart, Search, CreditCard, Receipt, PlusCircle, MinusCircle, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../Academic/Academic.css';

interface CartItem {
  billing: StudentBilling;
  amountToPay: string;
}

export const Cashier: React.FC = () => {
  const navigate = useNavigate();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [searchStudent, setSearchStudent] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  const [unpaidBillings, setUnpaidBillings] = useState<StudentBilling[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Only fetch students if search text is at least 3 chars (optimization)
    if (searchStudent.length >= 3) {
      const fetchS = async () => {
        try {
          const data = await getStudents({ search: searchStudent });
          setStudents(data);
        } catch (err) {
          console.error(err);
        }
      };
      const timer = setTimeout(fetchS, 500); // debounce
      return () => clearTimeout(timer);
    } else {
      setStudents([]);
    }
  }, [searchStudent]);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentBillings(selectedStudent.id);
    } else {
      setUnpaidBillings([]);
      setCart([]);
    }
  }, [selectedStudent]);

  const fetchStudentBillings = async (studentId: string) => {
    try {
      setLoading(true);
      // Fetch only UNPAID or PARTIAL billings
      const res1 = await getBillings({ studentId, status: 'UNPAID' });
      const res2 = await getBillings({ studentId, status: 'PARTIAL' });
      
      const allUnpaid = [...(res1.data || []), ...(res2.data || [])];
      
      // Sort by due date
      allUnpaid.sort((a, b) => new Date(a.dueDate || '').getTime() - new Date(b.dueDate || '').getTime());
      
      setUnpaidBillings(allUnpaid);
      setCart([]);
    } catch (err: any) {
      setError('Gagal memuat tagihan siswa');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStudent = (s: Student) => {
    setSelectedStudent(s);
    setSearchStudent('');
    setStudents([]);
  };

  const addToCart = (billing: StudentBilling) => {
    if (cart.find(c => c.billing.id === billing.id)) return;
    setCart([...cart, { billing, amountToPay: billing.remainingAmount.toString() }]);
  };

  const removeFromCart = (billingId: string) => {
    setCart(cart.filter(item => item.billing.id !== billingId));
  };

  const updateCartAmount = (billingId: string, amount: string) => {
    setCart(cart.map(item => {
      if (item.billing.id === billingId) {
        const numAmount = Number(amount);
        const maxAmount = Number(item.billing.remainingAmount);
        if (numAmount > maxAmount) {
           return { ...item, amountToPay: maxAmount.toString() };
        }
        return { ...item, amountToPay: amount };
      }
      return item;
    }));
  };

  const handleCheckout = async () => {
    if (!selectedStudent || cart.length === 0) return;
    
    // validate amounts
    if (cart.some(c => Number(c.amountToPay) <= 0)) {
      alert("Ada tagihan dengan nominal bayar 0. Harap perbaiki atau hapus dari keranjang.");
      return;
    }

    try {
      setIsProcessing(true);
      setError('');
      
      const payload = {
        studentId: selectedStudent.id,
        paymentMethod,
        notes,
        items: cart.map(item => ({
          billingId: item.billing.id,
          amountPaid: Number(item.amountToPay)
        }))
      };
      
      const result = await checkoutPayments(payload);
      
      alert('Pembayaran berhasil diproses!');
      // Navigate to receipts page
      navigate(`/finance/receipts?id=${result.id}`);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memproses pembayaran');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(amount));
  };

  const totalAmountToPay = cart.reduce((sum, item) => sum + Number(item.amountToPay), 0);

  return (
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Kasir Pembayaran</h1>
          <p className="page-subtitle">Terima pembayaran dari siswa untuk beberapa tagihan sekaligus (Multi-Billing Checkout)</p>
        </div>
      </div>

      {error && <div className="error-message mb-4">{error}</div>}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT COLUMN - STUDENT & BILLINGS */}
        <div className="flex-1 space-y-6">
          {/* 1. Student Selection */}
          <div className="glass-panel">
            <div className="p-4 border-b bg-gray-50/50 flex items-center gap-2 text-gray-700 font-medium">
              <User size={18} /> Data Siswa
            </div>
            <div className="p-4">
              {!selectedStudent ? (
                <div className="relative">
                  <label className="text-sm font-medium text-gray-700 block mb-2">Cari Siswa (Minimal 3 huruf)</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      className="input-field pl-9" 
                      placeholder="Ketik nama atau NIS..."
                      value={searchStudent}
                      onChange={(e) => setSearchStudent(e.target.value)}
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  </div>
                  
                  {students.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {students.map(s => (
                        <div 
                          key={s.id} 
                          className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 flex justify-between items-center"
                          onClick={() => handleSelectStudent(s)}
                        >
                          <div>
                            <div className="font-medium text-gray-800">{s.fullName}</div>
                            <div className="text-xs text-gray-500 font-mono">NIS: {s.nis}</div>
                          </div>
                          <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                            {(s as any).enrollments?.[0]?.classroom?.name || 'Belum ada kelas'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex justify-between items-center bg-blue-50 p-4 rounded-md border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                      {selectedStudent.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">{selectedStudent.fullName}</div>
                      <div className="text-sm text-gray-600 font-mono">NIS: {selectedStudent.nis} | {(selectedStudent as any).enrollments?.[0]?.classroom?.name || 'Tanpa Kelas'}</div>
                    </div>
                  </div>
                  <button 
                    className="text-sm text-blue-600 hover:underline px-3 py-1 bg-white rounded border border-blue-200"
                    onClick={() => setSelectedStudent(null)}
                  >
                    Ganti Siswa
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 2. Unpaid Billings List */}
          {selectedStudent && (
            <div className="glass-panel">
              <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
                <div className="flex items-center gap-2 text-gray-700 font-medium">
                  <Receipt size={18} /> Tagihan Belum Lunas
                </div>
                <div className="text-sm text-gray-500">
                  {unpaidBillings.length} tagihan ditemukan
                </div>
              </div>
              
              {loading ? (
                <div className="p-8 text-center text-gray-500">Mencari tagihan...</div>
              ) : unpaidBillings.length === 0 ? (
                <div className="p-8 text-center text-green-600 font-medium">
                  Hore! Tidak ada tagihan yang tertunggak.
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto p-4 space-y-3">
                  {unpaidBillings.map(billing => {
                    const inCart = cart.some(c => c.billing.id === billing.id);
                    const isLate = new Date(billing.dueDate || '') < new Date();
                    
                    return (
                      <div key={billing.id} className={`p-4 rounded-md border flex justify-between items-center transition-colors ${inCart ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-blue-100 hover:border-blue-300 shadow-sm'}`}>
                        <div>
                          <div className="font-semibold text-gray-800">{billing.paymentType?.name}</div>
                          <div className="text-sm text-gray-500 mb-1">{billing.paymentPeriod?.title}</div>
                          <div className="flex gap-3 text-xs">
                            <span className={isLate ? 'text-red-600 font-medium' : 'text-gray-500'}>
                              Jatuh Tempo: {new Date(billing.dueDate || '').toLocaleDateString('id-ID')}
                            </span>
                            {billing.status === 'PARTIAL' && (
                              <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">CICILAN</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <div>
                            <div className="text-sm text-gray-500">Sisa Tagihan</div>
                            <div className="font-bold text-gray-800 text-lg">{formatCurrency(billing.remainingAmount)}</div>
                          </div>
                          <button 
                            className={`p-2 rounded-full ${inCart ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-blue-600 bg-blue-50 hover:bg-blue-100'}`}
                            onClick={() => !inCart && addToCart(billing)}
                            disabled={inCart}
                            title="Pilih untuk dibayar"
                          >
                            <PlusCircle size={24} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN - CHECKOUT CART */}
        <div className="lg:w-96">
          <div className="glass-panel sticky top-6">
            <div className="p-4 border-b bg-gray-50/50 flex items-center gap-2 text-gray-700 font-medium">
              <ShoppingCart size={18} /> Rincian Pembayaran
            </div>
            
            <div className="p-4">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ShoppingCart size={48} className="mx-auto mb-3 opacity-20" />
                  <p>Belum ada tagihan yang dipilih</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="max-h-60 overflow-y-auto pr-2 space-y-3">
                    {cart.map(item => (
                      <div key={item.billing.id} className="bg-gray-50 p-3 rounded border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-medium text-sm text-gray-800">{item.billing.paymentType?.name}</div>
                            <div className="text-xs text-gray-500">{item.billing.paymentPeriod?.title}</div>
                          </div>
                          <button 
                            className="text-red-500 hover:text-red-700"
                            onClick={() => removeFromCart(item.billing.id)}
                          >
                            <MinusCircle size={16} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-600">Nominal Bayar:</span>
                          <input 
                            type="number" 
                            className="w-32 p-1.5 text-right text-sm border rounded font-semibold focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none"
                            value={item.amountToPay}
                            onChange={(e) => updateCartAmount(item.billing.id, e.target.value)}
                            min={0}
                            max={Number(item.billing.remainingAmount)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-medium text-gray-600">Total Tagihan:</span>
                      <span className="text-xl font-bold text-gray-800">{formatCurrency(totalAmountToPay)}</span>
                    </div>
                    
                    <div className="form-group mb-3">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1"><CreditCard size={14}/> Metode Pembayaran</label>
                      <select 
                        className="input-field mt-1" 
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      >
                        <option value="CASH">Tunai (Cash)</option>
                        <option value="TRANSFER">Transfer Bank</option>
                        <option value="QRIS">QRIS</option>
                        <option value="VA">Virtual Account</option>
                      </select>
                    </div>
                    
                    <div className="form-group mb-6">
                      <label className="text-sm font-medium text-gray-700">Keterangan Tambahan</label>
                      <input 
                        type="text" 
                        className="input-field mt-1 text-sm" 
                        placeholder="Opsional..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                    
                    <button 
                      className="btn-primary w-full py-3 text-lg font-bold shadow-md hover:shadow-lg transition-shadow"
                      onClick={handleCheckout}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Memproses...' : 'Proses Pembayaran'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
