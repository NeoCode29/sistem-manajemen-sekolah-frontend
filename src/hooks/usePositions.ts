import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/employeeService';
import type { Position } from '../api/employeeService';

export function usePositions(isActive?: boolean) {
  const [items, setItems] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getPositions(isActive);
      setItems(data);
    } catch (err) {
      console.error('Failed to load positions', err);
    } finally {
      setLoading(false);
    }
  }, [isActive]);

  useEffect(() => { load(); }, [load]);

  return {
    items,
    loading,
    create: async (dto: Partial<Position>) => { await api.createPosition(dto); await load(); },
    update: async (id: string, dto: Partial<Position>) => { await api.updatePosition(id, dto); await load(); },
    remove: async (id: string) => { await api.deletePosition(id); await load(); },
  };
}
