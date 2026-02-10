import { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Link2 } from 'lucide-react';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [linkedManuals, setLinkedManuals] = useState<LinkedManualInfo[]>([]);
  const [showLinkedPanel, setShowLinkedPanel] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
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

        if (!window.pdfjsLib) {
          throw new Error('PDF.js가 로드되지 않았습니다.');
        }

        const loadingTask = window.pdfjsLib.getDocument(fileUrl);
        const pdf = await loadingTask.promise;
        
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setLoading(false);
      } catch (err) {
        console.error('PDF 로드 오류:', err);
        setError('PDF 파일을 불러올 수 없습니다.');
        setLoading(false);
      }
    };

    loadPDF();
  }, [isOpen, fileUrl]);

  useEffect(() => {
    if (!pdfDoc || !containerRef.current) return;

    const calculateScale = async () => {
      const page = await pdfDoc.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      const containerWidth = containerRef.current!.clientWidth - 32;
      const newScale = containerWidth / viewport.width;
      setScale(Math.min(newScale, 2));
    };

    calculateScale();
    
    const handleResize = () => calculateScale();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pdfDoc]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || rendering) return;

    const renderPage = async () => {
      setRendering(true);
      try {
        const page = await pdfDoc.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        
        const canvas = canvasRef.current!;
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
      } catch (err) {
        console.error('페이지 렌더링 오류:', err);
      }
      setRendering(false);
    };

    renderPage();
  }, [pdfDoc, currentPage, scale]);

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentPage < totalPages) {
        goToNextPage();
      } else if (diff < 0 && currentPage > 1) {
        goToPrevPage();
      }
    }
    setTouchStart(null);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white w-full h-full md:w-11/12 md:h-5/6 md:max-w-4xl md:rounded-xl flex flex-col overflow-hidden shadow-2xl">
        <header className="flex items-center justify-between px-4 py-3 border-b bg-white">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="닫기"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex-1 text-center px-4">
            <h2 className="font-semibold text-gray-900 truncate">{title}</h2>
            <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
              {department && (
                <span 
                  className="text-xs px-2 py-0.5 rounded text-white"
                  style={{ backgroundColor: department.color || "#3B82F6" }}
                >
                  {department.name}
                </span>
              )}
              {hashtags.slice(0, 3).map((tag, index) => (
                <span key={index} className="text-xs text-gray-500">#{tag}</span>
              ))}
            </div>
          </div>
          
          {linkedManuals.length > 0 && (
            <button
              onClick={() => setShowLinkedPanel(!showLinkedPanel)}
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="연계 매뉴얼"
            >
              <Link2 className="w-5 h-5 text-purple-600" />
              <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {linkedManuals.length}
              </span>
            </button>
          )}
        </header>

        {showLinkedPanel && linkedManuals.length > 0 && (
          <div className="bg-purple-50 border-b border-purple-200 px-4 py-3">
            <p className="text-xs font-medium text-purple-700 mb-2">연계 매뉴얼</p>
            <div className="flex flex-wrap gap-2">
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-purple-300 rounded-full text-sm text-purple-700 hover:bg-purple-100 transition-colors shadow-sm"
                >
                  <Link2 className="w-3 h-3" />
                  {link.linkedManual.title}
                </button>
              ))}
            </div>
          </div>
        )}

        <div 
          ref={containerRef}
          className="flex-1 overflow-auto bg-gray-100"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {loading && (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
              <p className="text-gray-500">PDF를 불러오는 중...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-full p-4">
              <svg className="w-16 h-16 text-red-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-gray-600 mb-4 text-center">{error}</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => window.open(fileUrl, '_blank')}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  새 탭에서 열기
                </button>
              </div>
            </div>
          )}

          {!loading && !error && (
            <div className="flex justify-center p-4">
              <canvas 
                ref={canvasRef} 
                className="shadow-lg bg-white"
              />
            </div>
          )}
        </div>

        {!loading && !error && (
          <footer className="flex items-center justify-between px-4 py-3 border-t bg-white">
            <div className="flex items-center gap-1">
              <button 
                onClick={goToPrevPage}
                disabled={currentPage <= 1}
                className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="이전 페이지"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <span className="text-sm text-gray-600 min-w-[70px] text-center">
                {currentPage} / {totalPages}
              </span>
              
              <button 
                onClick={goToNextPage}
                disabled={currentPage >= totalPages}
                className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="다음 페이지"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={zoomOut}
                disabled={scale <= 0.5}
                className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-30 transition-colors"
                aria-label="축소"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              
              <span className="text-sm text-gray-600 min-w-[50px] text-center">
                {Math.round(scale * 100)}%
              </span>
              
              <button 
                onClick={zoomIn}
                disabled={scale >= 3}
                className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-30 transition-colors"
                aria-label="확대"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
