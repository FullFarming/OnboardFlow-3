import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, FileText } from "lucide-react";
import { type ContentIcon } from "@shared/schema";

interface ContentViewerProps {
  content: ContentIcon;
  onClose: () => void;
}

export default function ContentViewer({ content, onClose }: ContentViewerProps) {
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
        return (
          <div className="w-full">
            <img
              src={content.contentSource}
              alt={content.iconTitle}
              className="w-full h-auto rounded-lg shadow-lg"
            />
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

      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-600">지원되지 않는 콘텐츠 형식입니다.</p>
          </div>
        );
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle data-testid="text-content-modal-title">{content.iconTitle}</DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]" data-testid="content-modal-body">
          {renderContent()}
        </div>
        
        <div className="flex justify-center pt-4 border-t border-gray-200">
          <Button
            onClick={onClose}
            className="bg-brand-navy hover:bg-blue-800 text-white"
            data-testid="button-back-to-main"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            메인으로 돌아가기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
