import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Plus, Upload, X } from "lucide-react";

export default function UploadForm() {
  const { toast } = useToast();
  const [contentType, setContentType] = useState("");
  const [iconImageFile, setIconImageFile] = useState<File | null>(null);
  const [contentFile, setContentFile] = useState<File | null>(null);

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
    onSuccess: () => {
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
  };

  const handleIconImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setIconImageFile(file || null);
  };

  const handleContentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setContentFile(file || null);
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
                className="form-input"
                placeholder=" "
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
                <div className="upload-zone rounded-lg p-6 text-center cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">
                    {iconImageFile ? iconImageFile.name : "이미지를 선택하세요"}
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIconImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    data-testid="input-icon-image"
                  />
                </div>
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
                      className="form-input"
                      placeholder=" "
                      data-testid="input-content-source"
                    />
                    <Label className="form-label">URL을 입력하세요</Label>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Input
                        name="contentSource"
                        className="form-input"
                        placeholder=" "
                        data-testid="input-content-source"
                      />
                      <Label className="form-label">URL (선택사항)</Label>
                    </div>
                    <div className="upload-zone rounded-lg p-6 text-center cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm">
                        {contentFile ? contentFile.name : "또는 파일을 업로드하세요"}
                      </p>
                      <input
                        type="file"
                        accept={contentType === "PDF" ? ".pdf" : contentType === "Video" ? "video/*" : "image/*"}
                        onChange={handleContentFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        data-testid="input-content-file"
                      />
                    </div>
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

          <div className="relative w-full md:w-32">
            <Input
              name="displayOrder"
              type="number"
              required
              min="1"
              className="form-input"
              placeholder=" "
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
