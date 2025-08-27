import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, ExternalLink, FileText, CheckCircle2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type ContentIcon, type ContentImage } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ContentViewerProps {
  content: ContentIcon;
  employeeId: string;
  onClose: () => void;
  onComplete?: () => void;
}

export default function ContentViewer({ content, employeeId, onClose, onComplete }: ContentViewerProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch additional images for multi-image content
  const { data: contentImages = [] } = useQuery<ContentImage[]>({
    queryKey: [`/api/content-images/${content.id}`],
    enabled: content.contentType === "Image" || content.contentType === "Image Slideshow",
  });

  // Check if content is already completed
  const { data: progressData = [] } = useQuery<any[]>({
    queryKey: [`/api/progress/${employeeId}`],
  });

  useEffect(() => {
    if (progressData) {
      const currentProgress = progressData.find((p: any) => p.contentId === content.id);
      setIsCompleted(currentProgress?.completed === 1);
    }
  }, [progressData, content.id]);

  // Mark content as completed
  const completionMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/progress", {
      employeeId,
      contentId: content.id,
      completed: 1,
    }),
    onSuccess: () => {
      setIsCompleted(true);
      queryClient.invalidateQueries({ queryKey: [`/api/progress/${employeeId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/progress-summary/${employeeId}`] });
      onComplete?.();
      
      toast({
        title: "완료됨!",
        description: "콘텐츠를 성공적으로 완료했습니다.",
        variant: "default",
      });
    },
  });

  const handleMarkComplete = () => {
    setShowCompletionDialog(true);
  };

  const confirmCompletion = () => {
    completionMutation.mutate();
    setShowCompletionDialog(false);
  };

  const handleClose = () => {
    if (!isCompleted && (content.contentType === "Video" || content.contentType === "PDF" || content.contentType === "Image")) {
      setShowCompletionDialog(true);
    } else {
      onClose();
    }
  };
  const renderContent = () => {
    switch (content.contentType) {
      case "Video":
        return (
          <div className="aspect-video w-full">
            <iframe
              src={content.contentSource}
              className="w-full h-full rounded-lg"
              frameBorder="0"
              allowFullScreen
              title={content.iconTitle}
            />
          </div>
        );

      case "Image":
      case "Image Slideshow":
        // Handle multi-image content
        const allImages = contentImages.length > 0 ? contentImages : [{ imageUrl: content.contentSource, imageOrder: 1 }];
        const currentImage = allImages[currentImageIndex];
        
        // Ensure image URL is properly formatted
        const imageUrl = currentImage.imageUrl.startsWith('/uploads') 
          ? currentImage.imageUrl 
          : currentImage.imageUrl.startsWith('http') 
            ? currentImage.imageUrl 
            : currentImage.imageUrl.length > 0 
              ? `/uploads/${currentImage.imageUrl}`
              : '';
        
        return (
          <div className="w-full">
            <div className="relative">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={`${content.iconTitle} - ${currentImageIndex + 1}`}
                  className="w-full h-auto rounded-lg shadow-lg"
                  onError={(e) => {
                    console.error('이미지 로드 실패:', imageUrl);
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                  onLoad={() => {
                    console.log('이미지 로드 성공:', imageUrl);
                  }}
                />
              ) : (
                <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">이미지를 찾을 수 없습니다</span>
                </div>
              )}
              
              {/* Image Caption */}
              {(() => {
                let caption = "";
                
                // For single Image content, check if contentSource has caption data
                if (content.contentType === "Image" && contentImages.length === 0) {
                  try {
                    const parsed = JSON.parse(content.contentSource);
                    caption = parsed.caption || "";
                  } catch {
                    // No caption data
                  }
                }
                // For Image Slideshow or multi-image content, get caption from current image
                else if (currentImage?.imageCaption) {
                  caption = currentImage.imageCaption;
                }
                
                return caption ? (
                  <div className="mt-3 px-4 py-2 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 text-center">{caption}</p>
                  </div>
                ) : null;
              })()}

              {/* Multi-image navigation */}
              {allImages.length > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                    disabled={currentImageIndex === 0}
                    data-testid="button-prev-image"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    이전
                  </Button>
                  
                  <span className="text-sm text-gray-600">
                    {currentImageIndex + 1} / {allImages.length}
                  </span>
                  
                  <Button
                    variant="outline"
                    onClick={() => setCurrentImageIndex(Math.min(allImages.length - 1, currentImageIndex + 1))}
                    disabled={currentImageIndex === allImages.length - 1}
                    data-testid="button-next-image"
                  >
                    다음
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        );

      case "PDF":
        return (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">PDF 문서를 새 창에서 열어보세요</p>
            <Button
              onClick={() => window.open(content.contentSource, "_blank")}
              className="bg-brand-navy text-white hover:bg-blue-800"
              data-testid="button-open-pdf"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              PDF 열기
            </Button>
          </div>
        );

      case "Link":
        // Auto-redirect for links
        window.open(content.contentSource, "_blank");
        return (
          <div className="text-center py-12">
            <ExternalLink className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">링크로 이동 중...</p>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-600">지원되지 않는 콘텐츠 형식입니다.</p>
          </div>
        );
    }
  };

  return (
    <>
      <Dialog open={true} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" data-testid="text-content-modal-title">
              {content.iconTitle}
              {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            </DialogTitle>
            <DialogDescription>
              {content.contentType} 콘텐츠를 확인하고 학습을 진행하세요.
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-[calc(90vh-120px)]" data-testid="content-modal-body">
            {renderContent()}
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <Button
              onClick={onClose}
              variant="outline"
              data-testid="button-back-to-main"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              메인으로 돌아가기
            </Button>
            
            {!isCompleted && (
              <Button
                onClick={handleMarkComplete}
                className="bg-green-600 hover:bg-green-700 text-white"
                data-testid="button-mark-complete"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                완료하기
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Completion Confirmation Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>콘텐츠 완료</DialogTitle>
            <DialogDescription>
              선택한 콘텐츠의 학습 완료 상태를 변경할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600 mb-4">
              이 콘텐츠를 완료로 표시하시겠습니까?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCompletionDialog(false)}
                data-testid="button-cancel-completion"
              >
                취소
              </Button>
              <Button
                onClick={confirmCompletion}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={completionMutation.isPending}
                data-testid="button-confirm-completion"
              >
                {completionMutation.isPending ? "처리 중..." : "완료"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
