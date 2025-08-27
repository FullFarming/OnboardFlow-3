import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Plus, Upload, X, ChevronUp, ChevronDown, Images } from "lucide-react";

interface MultiImageItem {
  file: File;
  order: number;
}

export default function UploadForm() {
  const { toast } = useToast();
  const [contentType, setContentType] = useState("");
  const [iconImageFile, setIconImageFile] = useState<File | null>(null);
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [multiImages, setMultiImages] = useState<MultiImageItem[]>([]);

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

    addContentMutation.mutate(formData);
    
    // Reset form
    formElement.reset();
    setContentType("");
    setIconImageFile(null);
    setContentFile(null);
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
      const newImages = Array.from(files).map((file, index) => ({
        file,
        order: multiImages.length + index + 1,
      }));
      setMultiImages(prev => [...prev, ...newImages]);
      e.target.value = ''; // Reset input
    }
  };

  const removeMultiImage = (index: number) => {
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

                {/* Multi-Image List */}
                {multiImages.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">
                      추가된 이미지 ({multiImages.length}개)
                    </h4>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {multiImages.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                          data-testid={`multi-image-item-${index}`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                              {item.order}
                            </span>
                            <span className="text-sm text-gray-700 truncate">
                              {item.file.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({(item.file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => moveImageUp(index)}
                              disabled={index === 0}
                              data-testid={`button-move-up-${index}`}
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => moveImageDown(index)}
                              disabled={index === multiImages.length - 1}
                              data-testid={`button-move-down-${index}`}
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMultiImage(index)}
                              className="text-red-500 hover:text-red-700"
                              data-testid={`button-remove-multi-image-${index}`}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
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
    </Card>
  );
}
