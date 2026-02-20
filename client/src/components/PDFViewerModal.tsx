import { useEffect, useRef, useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Link2, Maximize2, Minimize2, BookCheck } from 'lucide-react';

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

interface LinkedManualInfo {
  id: string;
  linkedManualId: string;
  linkedManual: {
    id: string;
    title: string;
    fileUrl: string;
    departmentId: string;
    fileName: string | null;
    hashtags: string[] | null;
  };
}

interface PDFViewerModalProps {
  isOpen: boolean;
  fileUrl: string;
  title: string;
  manualId?: string;
  department?: { name: string; color: string | null } | null;
  hashtags?: string[];
  onClose: () => void;
  onOpenLinkedManual?: (manual: { id: string; title: string; fileUrl: string }) => void;
}

export default function PDFViewerModal({ 
  isOpen,
  fileUrl, 
  title, 
  manualId,
  department,
  hashtags = [],
  onClose,
  onOpenLinkedManual
}: PDFViewerModalProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());
  const [linkedManuals, setLinkedManuals] = useState<LinkedManualInfo[]>([]);
  const [showLinkedPanel, setShowLinkedPanel] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isReadingComplete, setIsReadingComplete] = useState(false);
  const renderingRef = useRef<Set<number>>(new Set());
  const baseScaleRef = useRef(1);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setIsReadingComplete(false);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && manualId) {
      fetch(`/api/manual-links/${manualId}`)
        .then(res => res.json())
        .then(data => setLinkedManuals(Array.isArray(data) ? data : []))
        .catch(() => setLinkedManuals([]));
    } else {
      setLinkedManuals([]);
      setShowLinkedPanel(false);
    }
  }, [isOpen, manualId]);

  useEffect(() => {
    if (!isOpen || !fileUrl) return;

    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);
        setCurrentPage(1);
        setRenderedPages(new Set());
        setIsReadingComplete(false);
        renderingRef.current = new Set();
        canvasRefs.current = new Map();

        if (!window.pdfjsLib) {
          throw new Error('PDF.js가 로드되지 않았습니다.');
        }

        const loadingTask = window.pdfjsLib.getDocument(fileUrl);
        const pdf = await loadingTask.promise;
        
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);

        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1 });
        const containerWidth = window.innerWidth - 16;
        const newScale = containerWidth / viewport.width;
        baseScaleRef.current = newScale;
        setScale(Math.min(newScale, 2.5));

        setLoading(false);
      } catch (err) {
        console.error('PDF 로드 오류:', err);
        setError('PDF 파일을 불러올 수 없습니다.');
        setLoading(false);
      }
    };

    loadPDF();
  }, [isOpen, fileUrl]);

  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || renderingRef.current.has(pageNum) || renderedPages.has(pageNum)) return;
    
    const canvas = canvasRefs.current.get(pageNum);
    if (!canvas) return;

    renderingRef.current.add(pageNum);

    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      
      const context = canvas.getContext('2d')!;
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = viewport.width * pixelRatio;
      canvas.height = viewport.height * pixelRatio;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      setRenderedPages(prev => new Set(prev).add(pageNum));
    } catch (err) {
      console.error(`페이지 ${pageNum} 렌더링 오류:`, err);
    } finally {
      renderingRef.current.delete(pageNum);
    }
  }, [pdfDoc, scale, renderedPages]);

  useEffect(() => {
    if (!pdfDoc || loading) return;
    setRenderedPages(new Set());
    renderingRef.current = new Set();
  }, [scale]);

  // For single-page PDFs, mark reading complete once loaded
  useEffect(() => {
    if (totalPages === 1 && !loading && !error) {
      setIsReadingComplete(true);
    }
  }, [totalPages, loading, error]);

  useEffect(() => {
    if (!pdfDoc || loading) return;

    const renderVisiblePages = () => {
      for (let i = 1; i <= totalPages; i++) {
        renderPage(i);
      }
    };

    const timer = setTimeout(renderVisiblePages, 100);
    return () => clearTimeout(timer);
  }, [pdfDoc, loading, totalPages, renderPage, renderedPages]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !pdfDoc || loading) return;

    const handleScroll = () => {
      const canvases = container.querySelectorAll('canvas[data-page]');
      let closestPage = 1;
      let closestDistance = Infinity;
      const containerTop = container.scrollTop;
      const containerCenter = containerTop + container.clientHeight / 2;

      canvases.forEach((canvas) => {
        const pageNum = parseInt(canvas.getAttribute('data-page') || '1');
        const rect = canvas.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const canvasCenter = (rect.top - containerRect.top) + containerTop + rect.height / 2;
        const distance = Math.abs(canvasCenter - containerCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestPage = pageNum;
        }
      });

      setCurrentPage(closestPage);

      // Mark reading complete when scrolled near the bottom
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollTop + clientHeight >= scrollHeight - 150) {
        setIsReadingComplete(true);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [pdfDoc, loading]);

  const setCanvasRef = useCallback((pageNum: number) => (el: HTMLCanvasElement | null) => {
    if (el) {
      canvasRefs.current.set(pageNum, el);
    } else {
      canvasRefs.current.delete(pageNum);
    }
  }, []);

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };
  
  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const resetZoom = () => {
    setScale(baseScaleRef.current);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 flex flex-col">
      <header className="flex items-center justify-between px-3 py-2 bg-white border-b shadow-sm safe-area-top" style={{ paddingTop: 'max(8px, env(safe-area-inset-top))' }}>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex-1 text-center px-2 min-w-0">
          <h2 className="font-semibold text-gray-900 text-sm truncate">{title}</h2>
          <div className="flex items-center justify-center gap-1.5 mt-0.5 flex-wrap">
            {department && (
              <span 
                className="text-[10px] px-1.5 py-0.5 rounded text-white"
                style={{ backgroundColor: department.color || "#3B82F6" }}
              >
                {department.name}
              </span>
            )}
            {hashtags.slice(0, 2).map((tag, index) => (
              <span key={index} className="text-[10px] text-gray-400">#{tag}</span>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          {linkedManuals.length > 0 && (
            <button
              onClick={() => setShowLinkedPanel(!showLinkedPanel)}
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="연계 매뉴얼"
            >
              <Link2 className="w-5 h-5 text-purple-600" />
              <span className="absolute -top-0.5 -right-0.5 bg-purple-600 text-white text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {linkedManuals.length}
              </span>
            </button>
          )}
        </div>
      </header>

      {showLinkedPanel && linkedManuals.length > 0 && (
        <div className="bg-purple-50 border-b border-purple-200 px-3 py-2">
          <p className="text-[10px] font-medium text-purple-700 mb-1.5">연계 매뉴얼</p>
          <div className="flex flex-wrap gap-1.5">
            {linkedManuals.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  if (onOpenLinkedManual) {
                    onOpenLinkedManual({
                      id: link.linkedManual.id,
                      title: link.linkedManual.title,
                      fileUrl: link.linkedManual.fileUrl
                    });
                  }
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-purple-300 rounded-full text-xs text-purple-700 hover:bg-purple-100 transition-colors shadow-sm"
              >
                <Link2 className="w-3 h-3" />
                <span className="truncate max-w-[120px]">{link.linkedManual.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-auto"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {loading && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mb-3"></div>
            <p className="text-gray-500 text-sm">PDF를 불러오는 중...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <svg className="w-14 h-14 text-red-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-gray-600 mb-3 text-center text-sm">{error}</p>
            <button 
              onClick={() => window.open(fileUrl, '_blank')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
            >
              새 탭에서 열기
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="flex flex-col items-center gap-2 py-2 px-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <canvas
                key={`page-${pageNum}-${scale}`}
                ref={setCanvasRef(pageNum)}
                data-page={pageNum}
                className="bg-white shadow-md w-full"
                style={{ maxWidth: '100%' }}
              />
            ))}

            {/* Linked manuals section shown after reading completion */}
            {isReadingComplete && linkedManuals.length > 0 && (
              <div className="w-full mt-4 mb-2">
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BookCheck className="w-4 h-4 text-purple-600" />
                    <h3 className="text-sm font-semibold text-purple-800">연계 매뉴얼</h3>
                    <span className="text-xs text-purple-400 ml-auto">{linkedManuals.length}개</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {linkedManuals.map((link) => (
                      <button
                        key={link.id}
                        onClick={() => {
                          if (onOpenLinkedManual) {
                            onOpenLinkedManual({
                              id: link.linkedManual.id,
                              title: link.linkedManual.title,
                              fileUrl: link.linkedManual.fileUrl,
                            });
                          }
                        }}
                        className="flex items-center gap-3 p-3 bg-white border border-purple-200 rounded-lg text-left hover:bg-purple-100 transition-colors shadow-sm"
                      >
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Link2 className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{link.linkedManual.title}</p>
                          {link.linkedManual.hashtags && link.linkedManual.hashtags.length > 0 && (
                            <p className="text-xs text-gray-400 truncate">
                              {link.linkedManual.hashtags.slice(0, 2).map((t) => `#${t}`).join(' ')}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {!loading && !error && (
        <footer className="flex items-center justify-between px-3 py-2 border-t bg-white shadow-inner" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
          <span className="text-xs text-gray-500 min-w-[60px]">
            {currentPage} / {totalPages}
          </span>

          <div className="flex items-center gap-0.5">
            <button 
              onClick={zoomOut}
              disabled={scale <= 0.5}
              className="p-2.5 hover:bg-gray-100 rounded-full disabled:opacity-30 transition-colors active:bg-gray-200"
              aria-label="축소"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            
            <button
              onClick={resetZoom}
              className="text-xs text-gray-600 px-2 py-1 hover:bg-gray-100 rounded transition-colors active:bg-gray-200"
            >
              {Math.round(scale * 100)}%
            </button>
            
            <button 
              onClick={zoomIn}
              disabled={scale >= 3}
              className="p-2.5 hover:bg-gray-100 rounded-full disabled:opacity-30 transition-colors active:bg-gray-200"
              aria-label="확대"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
