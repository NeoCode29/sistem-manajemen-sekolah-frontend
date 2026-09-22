import { useState, useEffect, useCallback } from 'react';
import { getPromotions, cancelPromotion as apiCancelPromotion } from '../api/promotionService';
import { parseApiError } from '../utils/feedback';

export function usePromotions(initialPage = 1, initialLimit = 15) {
  const [promotionsHistory, setPromotionsHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialLimit);

  const fetchHistory = useCallback(async (page = currentPage, limit = itemsPerPage) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPromotions({ page, limit });
      setPromotionsHistory(response.data || []);
      setTotalPages(response.totalPages || 1);
      setCurrentPage(page);
    } catch (err: any) {
      console.error('Failed to fetch promotions:', err);
      setError(parseApiError(err, 'Gagal memuat riwayat kenaikan kelas'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    fetchHistory(currentPage, itemsPerPage);
  }, [fetchHistory, currentPage, itemsPerPage]);

  const cancelPromotion = async (id: string) => {
    try {
      await apiCancelPromotion(id);
      await fetchHistory(currentPage, itemsPerPage);
    } catch (err: any) {
      throw new Error(parseApiError(err, 'Gagal membatalkan kenaikan kelas'));
    }
  };

  return {
    promotionsHistory,
    loading,
    error,
    currentPage,
    totalPages,
    itemsPerPage,
    setCurrentPage,
    setItemsPerPage,
    refresh: () => fetchHistory(currentPage, itemsPerPage),
    cancelPromotion
  };
}
