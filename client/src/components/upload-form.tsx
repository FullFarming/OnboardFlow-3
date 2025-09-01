import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Plus, Upload, X, ChevronUp, ChevronDown, Images, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import Sortable from "sortablejs";
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';

interface MultiImageItem {
  file: File;
  preview: string;
  caption: string;
  guideSentence: string;
  order: number;
}

export default function UploadForm() {
  const { toast } = useToast();
  const [contentType, setContentType] = useState("");
  const [iconImageFile, setIconImageFile] = useState<File | null>(null);
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [imageCaption, setImageCaption] = useState(""); // For single image caption
  const [imageGuideSentence, setImageGuideSentence] = useState(""); // For single image guide sentence
  const [multiImages, setMultiImages] = useState<MultiImageItem[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const sortableContainer = useRef<HTMLDivElement>(null);

  const addContentMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/content-icons", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Failed to create content");
      }
      return response.json();
    },
    onSuccess: async (newContent) => {
      // If there are multiple images for Image Slideshow content type, upload them
      if (contentType === "Image Slideshow" && multiImages.length > 0) {
        try {
          const imageFormData = new FormData();
          multiImages.forEach((item) => {
            imageFormData.append('images', item.file);
            imageFormData.append('captions', item.caption);
            imageFormData.append('guideSentences', item.guideSentence);
          });
          imageFormData.append('contentId', newContent.id);
          
          const imageResponse = await fetch("/api/content-images", {
            method: "POST",
            body: imageFormData,
          });
          
          if (!imageResponse.ok) {
            throw new Error("Failed to upload additional images");
          }
        } catch (error) {
          toast({ 
            title: "추가 이미지 업로드 실패", 
            description: "콘텐츠는 생성되었지만 추가 이미지 업로드에 실패했습니다.",
            variant: "destructive" 
          });
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/content-icons"] });
      toast({ title: "콘텐츠가 성공적으로 추가되었습니다." });
    },
    onError: () => {
      toast({ title: "콘텐츠 추가 실패", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formElement = e.currentTarget;
    const formData = new FormData(formElement);

    // Add files to FormData if they exist
    if (iconImageFile) {
      formData.append("iconImage", iconImageFile);
    }
    if (contentFile) {
      formData.append("contentFile", contentFile);
    }

    // For Image content type, append caption to contentSource
    if (contentType === "Image" && contentFile && (imageCaption || imageGuideSentence)) {
      // Override contentSource with JSON structure
      const contentWithCaption = JSON.stringify({
        url: formData.get("contentSource") || "",
        caption: imageCaption,
        guideSentence: imageGuideSentence
      });
      formData.set("contentSource", contentWithCaption);
    }

    addContentMutation.mutate(formData);
    
    // Reset form
    formElement.reset();
    setContentType("");
    setIconImageFile(null);
    setContentFile(null);
    setImageCaption("");
    setImageGuideSentence("");
    setMultiImages([]);
  };

  const handleIconImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setIconImageFile(file || null);
  };

  const handleContentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setContentFile(file || null);
  };

  const handleMultiImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const preview = event.target?.result as string;
          const newImage: MultiImageItem = {
            file,
            preview,
            caption: "", // Default empty caption
            guideSentence: "", // Default empty guide sentence
            order: multiImages.length + index + 1,
          };
          setMultiImages(prev => [...prev, newImage].map((item, i) => ({
            ...item,
            order: i + 1,
          })));
        };
        reader.readAsDataURL(file);
      });
      e.target.value = ''; // Reset input
    }
  };

  const removeMultiImage = (index: number) => {
    const imageToRemove = multiImages[index];
    // Revoke the object URL to free memory
    if (imageToRemove.preview) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    setMultiImages(prev => 
      prev.filter((_, i) => i !== index).map((item, i) => ({
        ...item,
        order: i + 1,
      }))
    );
  };

  const moveImageUp = (index: number) => {
    if (index === 0) return;
    setMultiImages(prev => {
      const newArray = [...prev];
      [newArray[index - 1], newArray[index]] = [newArray[index], newArray[index - 1]];
      return newArray.map((item, i) => ({ ...item, order: i + 1 }));
    });
  };

  const moveImageDown = (index: number) => {
    if (index === multiImages.length - 1) return;
    setMultiImages(prev => {
      const newArray = [...prev];
      [newArray[index], newArray[index + 1]] = [newArray[index + 1], newArray[index]];
      return newArray.map((item, i) => ({ ...item, order: i + 1 }));
    });
  };

  const updateImageCaption = (index: number, caption: string) => {
    setMultiImages(prev => 
      prev.map((item, i) => i === index ? { ...item, caption } : item)
    );
  };

  const updateImageGuideSentence = (index: number, guideSentence: string) => {
    setMultiImages(prev => 
      prev.map((item, i) => i === index ? { ...item, guideSentence } : item)
    );
  };

  // Initialize Sortable for drag-and-drop reordering
  useEffect(() => {
    if (sortableContainer.current && multiImages.length > 0) {
      const sortable = Sortable.create(sortableContainer.current, {
        animation: 150,
        handle: '.drag-handle',
        onEnd: (evt) => {
          const { oldIndex, newIndex } = evt;
          if (oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex) {
            setMultiImages(prev => {
              const newArray = [...prev];
              const [movedItem] = newArray.splice(oldIndex, 1);
              newArray.splice(newIndex, 0, movedItem);
              return newArray.map((item, i) => ({ ...item, order: i + 1 }));
            });
          }
        },
      });
      return () => sortable.destroy();
    }
  }, [multiImages.length]);

  // Slideshow navigation functions
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % multiImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + multiImages.length) % multiImages.length);
  };

  const openPreviewModal = () => {
    setCurrentSlide(0);
    setShowPreviewModal(true);
  };

  const needsFileUpload = contentType && contentType !== "Link";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          새 콘텐츠 아이콘 생성
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Input
                name="iconTitle"
                required
                className="form-input peer"
                placeholder=""
                data-testid="input-icon-title"
              />
              <Label className="form-label">아이콘 제목</Label>
            </div>
            <div className="relative">
              <Select 
                name="contentType" 
                required 
                value={contentType} 
                onValueChange={setContentType}
              >
                <SelectTrigger className="form-input pt-3" data-testid="select-content-type">
                  <SelectValue placeholder="선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Link">링크</SelectItem>
                  <SelectItem value="Video">비디오</SelectItem>
                  <SelectItem value="Image">이미지</SelectItem>
                  <SelectItem value="Image Slideshow">이미지 슬라이드쇼</SelectItem>
                  <SelectItem value="PDF">PDF</SelectItem>
                </SelectContent>
              </Select>
              <Label className="form-label">콘텐츠 타입</Label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Icon Image Upload */}
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                아이콘 이미지 (선택사항)
              </Label>
              <div className="space-y-2">
                <label className="upload-zone rounded-lg p-6 text-center cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors block">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">
                    {iconImageFile ? iconImageFile.name : "이미지를 선택하세요"}
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIconImageChange}
                    className="hidden"
                    data-testid="input-icon-image"
                  />
                </label>
                {iconImageFile && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIconImageFile(null)}
                    className="w-full"
                    data-testid="button-remove-icon-image"
                  >
                    <X className="h-4 w-4 mr-1" />
                    이미지 제거
                  </Button>
                )}
              </div>
            </div>

            {/* Content Source */}
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                콘텐츠 소스
              </Label>
              <div className="space-y-2">
                {contentType === "Link" ? (
                  <div className="relative">
                    <Input
                      name="contentSource"
                      type="url"
                      required
                      className="form-input peer"
                      placeholder=""
                      data-testid="input-content-source"
                    />
                    <Label className="form-label">URL을 입력하세요</Label>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Input
                        name="contentSource"
                        className="form-input peer"
                        placeholder=""
                        data-testid="input-content-source"
                      />
                      <Label className="form-label">URL (선택사항)</Label>
                    </div>
                    <label className="upload-zone rounded-lg p-6 text-center cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors block">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm">
                        {contentFile ? contentFile.name : "또는 파일을 업로드하세요"}
                      </p>
                      <input
                        type="file"
                        accept={contentType === "PDF" ? ".pdf" : contentType === "Video" ? "video/*" : "image/*"}
                        onChange={handleContentFileChange}
                        className="hidden"
                        data-testid="input-content-file"
                      />
                    </label>
                    {contentFile && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setContentFile(null)}
                        className="w-full"
                        data-testid="button-remove-content-file"
                      >
                        <X className="h-4 w-4 mr-1" />
                        파일 제거
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Image Caption and Guide Sentence for Single Image Content Type */}
          {contentType === "Image" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="block text-sm font-medium text-gray-700">
                  이미지 캡션
                </Label>
                <Textarea
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  placeholder="이미지에 대한 설명을 입력하세요..."
                  className="min-h-[80px] resize-none"
                  data-testid="textarea-image-caption"
                />
                <p className="text-xs text-gray-500">
                  사용자에게 이미지와 함께 표시될 설명입니다.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label className="block text-sm font-medium text-gray-700">
                  가이드 문장 (마크다운 지원)
                </Label>
                <div className="border rounded-md overflow-hidden">
                  <MdEditor
                    value={imageGuideSentence}
                    style={{ height: '300px' }}
                    renderHTML={(text) => Promise.resolve(text)}
                    onChange={({ text }) => setImageGuideSentence(text)}
                    placeholder="사용자에게 표시할 가이드 문장을 마크다운으로 입력하세요..."
                    view={{ menu: true, md: true, html: true }}
                    canView={{ menu: true, md: true, html: true, both: false, fullScreen: true, hideMenu: true }}
                    data-testid="markdown-editor-image-guide-sentence"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  마크다운 형식으로 입력하여 제목, 굵은 글씨, 목록 등을 사용할 수 있습니다.
                </p>
              </div>
            </div>
          )}

          {/* Multi-Image Upload for Image Slideshow Content Type */}
          {contentType === "Image Slideshow" && (
            <div className="space-y-4">
              <div className="border-t border-gray-200 pt-4">
                <Label className="block text-sm font-medium text-gray-700 mb-4">
                  <Images className="inline h-4 w-4 mr-2" />
                  추가 이미지 (순서대로 표시됨)
                </Label>
                
                {/* Add Multiple Images */}
                <div className="mb-4">
                  <label className="upload-zone rounded-lg p-4 text-center cursor-pointer border-2 border-dashed border-blue-300 hover:border-blue-500 transition-colors block">
                    <Upload className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                    <p className="text-blue-600 text-sm font-medium">
                      여러 이미지 추가하기
                    </p>
                    <p className="text-gray-500 text-xs">
                      여러 파일을 한 번에 선택할 수 있습니다
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleMultiImageAdd}
                      className="hidden"
                      data-testid="input-multi-images"
                    />
                  </label>
                </div>

                {/* Multi-Image Preview Grid with Drag & Drop */}
                {multiImages.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-700">
                        추가된 이미지 ({multiImages.length}개)
                      </h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={openPreviewModal}
                        className="text-blue-600 hover:text-blue-700"
                        data-testid="button-preview-slideshow"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        슬라이드쇼 미리보기
                      </Button>
                    </div>
                    
                    <div 
                      ref={sortableContainer}
                      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                    >
                      {multiImages.map((item, index) => (
                        <div
                          key={index}
                          className="relative group bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-move drag-handle"
                          data-testid={`multi-image-item-${index}`}
                        >
                          {/* Order Badge */}
                          <div className="absolute top-2 left-2 z-10 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {item.order}
                          </div>
                          
                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={() => removeMultiImage(index)}
                            className="absolute top-2 right-2 z-10 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            data-testid={`button-remove-multi-image-${index}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                          
                          {/* Image Preview */}
                          <div className="aspect-square bg-gray-100">
                            <img
                              src={item.preview}
                              alt={item.file.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          {/* File Info and Caption */}
                          <div className="p-2 space-y-2">
                            <div>
                              <p className="text-xs text-gray-600 truncate">
                                {item.file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(item.file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                            
                            {/* Caption input */}
                            <div className="space-y-1">
                              <Label className="text-xs font-medium text-gray-600">
                                캡션
                              </Label>
                              <Textarea
                                value={item.caption}
                                onChange={(e) => updateImageCaption(index, e.target.value)}
                                placeholder="이미지 설명..."
                                className="min-h-[50px] resize-none text-xs"
                                data-testid={`textarea-multi-image-caption-${index}`}
                              />
                            </div>
                            
                            {/* Guide Sentence input */}
                            <div className="space-y-1">
                              <Label className="text-xs font-medium text-gray-600">
                                가이드 문장 (마크다운)
                              </Label>
                              <div className="border rounded overflow-hidden">
                                <MdEditor
                                  value={item.guideSentence}
                                  style={{ height: '150px' }}
                                  renderHTML={(text) => Promise.resolve(text)}
                                  onChange={({ text }) => updateImageGuideSentence(index, text)}
                                  placeholder="마크다운으로 가이드 문장 입력..."
                                  view={{ menu: true, md: true, html: false }}
                                  canView={{ menu: true, md: true, html: false, both: false, fullScreen: false, hideMenu: false }}
                                  data-testid={`markdown-editor-multi-image-guide-${index}`}
                                />
                              </div>
                            </div>
                          </div>
                          
                          {/* Drag Handle Indicator */}
                          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-50 transition-opacity">
                            <div className="flex space-x-1">
                              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <p className="text-xs text-gray-500 text-center">
                      💡 이미지를 드래그하여 순서를 변경할 수 있습니다
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="relative w-full md:w-32">
            <Input
              name="displayOrder"
              type="number"
              required
              min="1"
              className="form-input peer"
              placeholder=""
              data-testid="input-display-order"
            />
            <Label className="form-label">표시 순서</Label>
          </div>

          <Button
            type="submit"
            className="bg-brand-navy hover:bg-blue-800 text-white"
            disabled={addContentMutation.isPending}
            data-testid="button-add-content"
          >
            <Plus className="mr-2 h-4 w-4" />
            콘텐츠 추가
          </Button>
        </form>
      </CardContent>

      {/* Slideshow Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-4xl w-full h-[80vh] p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              슬라이드쇼 미리보기
            </DialogTitle>
          </DialogHeader>
          
          {multiImages.length > 0 && (
            <div className="flex-1 flex flex-col">
              {/* Slideshow Container */}
              <div className="flex-1 relative bg-black rounded-lg mx-6 mb-4">
                <img
                  src={multiImages[currentSlide]?.preview}
                  alt={multiImages[currentSlide]?.file.name}
                  className="w-full h-full object-contain"
                />
                
                {/* Navigation Buttons */}
                {multiImages.length > 1 && (
                  <>
                    <button
                      onClick={prevSlide}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all"
                      data-testid="button-prev-slide"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={nextSlide}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all"
                      data-testid="button-next-slide"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}
                
                {/* Slide Counter */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  {currentSlide + 1} / {multiImages.length}
                </div>
              </div>
              
              {/* Thumbnail Navigation */}
              {multiImages.length > 1 && (
                <div className="px-6 pb-6">
                  <div className="flex justify-center space-x-2 overflow-x-auto">
                    {multiImages.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          currentSlide === index
                            ? 'border-blue-500 opacity-100'
                            : 'border-gray-300 opacity-50 hover:opacity-75'
                        }`}
                        data-testid={`thumbnail-${index}`}
                      >
                        <img
                          src={item.preview}
                          alt={item.file.name}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
