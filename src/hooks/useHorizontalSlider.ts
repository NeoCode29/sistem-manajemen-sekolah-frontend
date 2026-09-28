import { useState, useRef, useCallback, useEffect } from 'react';

interface UseHorizontalSliderOptions {
  gap?: number;
  dependencies?: any[];
}

export const useHorizontalSlider = ({ gap = 16, dependencies = [] }: UseHorizontalSliderOptions = {}) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftStartRef = useRef(0);
  const hasMovedRef = useRef(false);

  const updateScrollState = useCallback(() => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    const maxScroll = scrollWidth - clientWidth;
    
    // Memberikan toleransi sub-pixel (1-2px) untuk DPI scaling Windows / multi-monitor
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(maxScroll > 2 && Math.ceil(scrollLeft) < maxScroll - 2);
  }, []);

  const scrollSlider = useCallback((direction: 'left' | 'right') => {
    if (!sliderRef.current) return;
    const container = sliderRef.current;
    
    // Dapatkan lebar kartu pertama untuk langkah geser yang akurat
    const firstCard = container.querySelector<HTMLElement>(':scope > div');
    const cardWidth = firstCard ? firstCard.offsetWidth : 320;
    const step = cardWidth + gap;
    const delta = direction === 'left' ? -step : step;

    container.scrollBy({ left: delta, behavior: 'smooth' });
    
    // Verifikasi posisi di beberapa checkpoint animasi smooth scroll
    setTimeout(updateScrollState, 150);
    setTimeout(updateScrollState, 350);
    setTimeout(updateScrollState, 500);
  }, [gap, updateScrollState]);

  // Mouse Drag-to-Scroll Handlers (Pengalaman geser mulus di desktop)
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;
    if (e.button !== 0) return; // Hanya klik kiri
    
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.pageX - sliderRef.current.offsetLeft;
    scrollLeftStartRef.current = sliderRef.current.scrollLeft;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = x - startXRef.current;
    if (Math.abs(walk) > 4) {
      hasMovedRef.current = true;
      sliderRef.current.scrollLeft = scrollLeftStartRef.current - walk;
      updateScrollState();
    }
  }, [updateScrollState]);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    // Debounce reset hasMoved agar event click kartu sesudahnya bisa membedakan klik vs drag
    setTimeout(() => {
      hasMovedRef.current = false;
    }, 50);
    updateScrollState();
  }, [updateScrollState]);

  const handleMouseLeave = useCallback(() => {
    isDraggingRef.current = false;
    hasMovedRef.current = false;
    updateScrollState();
  }, [updateScrollState]);

  // Pembungkus klik kartu: hanya jalankan aksi jika bukan hasil drag
  const handleCardClick = useCallback((callback: () => void) => {
    if (hasMovedRef.current) {
      return;
    }
    callback();
  }, []);

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;

    // Perhitungan bertahap saat layout/gambar settle
    updateScrollState();
    const t1 = setTimeout(updateScrollState, 60);
    const t2 = setTimeout(updateScrollState, 200);
    const t3 = setTimeout(updateScrollState, 500);

    const onScroll = () => updateScrollState();
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateScrollState();
      });
      resizeObserver.observe(el);
      // Pantau juga elemen kartu pertama jika ada
      if (el.firstElementChild) {
        resizeObserver.observe(el.firstElementChild);
      }
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateScrollState, ...dependencies]);

  return {
    sliderRef,
    canScrollLeft,
    canScrollRight,
    scrollSlider,
    updateScrollState,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleCardClick,
    isDragging: isDraggingRef.current
  };
};
