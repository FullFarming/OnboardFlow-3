import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Shield, Users, Grid3X3, LogOut, Edit, Trash2, Plus, Upload } from "lucide-react";
import { type Employee, type ContentIcon } from "@shared/schema";
import UploadForm from "@/components/upload-form";
import dashboardBg from "@assets/image_1756257576204.png";

export default function AdminDashboard() {
  const { logoutMutation } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("users");
  const [editingContent, setEditingContent] = useState<ContentIcon | null>(null);

  // Fetch employees
  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  // Fetch content icons
  const { data: contentIcons = [], isLoading: contentLoading } = useQuery<ContentIcon[]>({
    queryKey: ["/api/content-icons"],
  });

  // Employee mutations
  const addEmployeeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/employees", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: "사용자가 성공적으로 추가되었습니다." });
    },
    onError: () => {
      toast({ title: "사용자 추가 실패", variant: "destructive" });
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: "사용자가 삭제되었습니다." });
    },
    onError: () => {
      toast({ title: "사용자 삭제 실패", variant: "destructive" });
    },
  });

  // Content mutations
  const deleteContentMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/content-icons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-icons"] });
      toast({ title: "콘텐츠가 삭제되었습니다." });
    },
    onError: () => {
      toast({ title: "콘텐츠 삭제 실패", variant: "destructive" });
    },
  });

  const updateContentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      const response = await fetch(`/api/content-icons/${id}`, {
        method: "PUT",
        body: data,
      });
      if (!response.ok) {
        throw new Error("Failed to update content");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-icons"] });
      toast({ title: "콘텐츠가 성공적으로 수정되었습니다." });
      setEditingContent(null);
    },
    onError: () => {
      toast({ title: "콘텐츠 수정 실패", variant: "destructive" });
    },
  });

  const handleEmployeeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      userName: formData.get("userName") as string,
      userPassword: formData.get("userPassword") as string,
      email: formData.get("email") as string,
      buddyName: formData.get("buddyName") as string,
      lockerNumber: formData.get("lockerNumber") as string,
      laptopInfo: formData.get("laptopInfo") as string,
    };
    addEmployeeMutation.mutate(data);
    e.currentTarget.reset();
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "Video": return "🎥";
      case "PDF": return "📄";
      case "Image": return "🖼️";
      case "Image Slideshow": return "🎠";
      case "Link": return "🔗";
      default: return "📁";
    }
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingContent) return;
    
    const formElement = e.currentTarget;
    const formData = new FormData(formElement);
    
    updateContentMutation.mutate({ id: editingContent.id, data: formData });
  };

  return (
    <div 
      className="min-h-screen bg-gray-50"
      style={{ backgroundImage: `url(${dashboardBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}
    >
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-brand-navy rounded-lg flex items-center justify-center">
                <Shield className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">관리자 대시보드</h1>
                <p className="text-sm text-gray-500">C&W Korea Onboarding Admin</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700"
              data-testid="button-logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="users" className="flex items-center gap-2" data-testid="tab-users">
              <Users className="h-4 w-4" />
              사용자 관리
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2" data-testid="tab-content">
              <Grid3X3 className="h-4 w-4" />
              콘텐츠 관리
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            {/* Add User Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  신규 사용자 등록
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEmployeeSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Input
                      name="userName"
                      required
                      className="form-input peer"
                      placeholder=""
                      data-testid="input-user-name"
                    />
                    <Label className="form-label">사용자명 (로그인 ID)</Label>
                  </div>
                  <div className="relative">
                    <Input
                      name="userPassword"
                      type="tel"
                      required
                      maxLength={4}
                      className="form-input peer"
                      placeholder=""
                      data-testid="input-user-password"
                    />
                    <Label className="form-label">휴대폰 뒷 4자리</Label>
                  </div>
                  <div className="relative">
                    <Input
                      name="email"
                      type="email"
                      required
                      className="form-input peer"
                      placeholder=""
                      data-testid="input-user-email"
                    />
                    <Label className="form-label">이메일</Label>
                  </div>
                  <div className="relative">
                    <Input
                      name="buddyName"
                      required
                      className="form-input peer"
                      placeholder=""
                      data-testid="input-buddy-name"
                    />
                    <Label className="form-label">버디명</Label>
                  </div>
                  <div className="relative">
                    <Input
                      name="lockerNumber"
                      required
                      className="form-input peer"
                      placeholder=""
                      data-testid="input-locker-number"
                    />
                    <Label className="form-label">사물함 번호</Label>
                  </div>
                  <div className="relative">
                    <Input
                      name="laptopInfo"
                      required
                      className="form-input peer"
                      placeholder=""
                      data-testid="input-laptop-info"
                    />
                    <Label className="form-label">임시pw</Label>
                  </div>
                  <div className="md:col-span-2">
                    <Button
                      type="submit"
                      className="bg-brand-navy hover:bg-blue-800 text-white"
                      disabled={addEmployeeMutation.isPending}
                      data-testid="button-add-user"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      사용자 추가
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Users List */}
            <Card>
              <CardHeader>
                <CardTitle>등록된 사용자</CardTitle>
              </CardHeader>
              <CardContent>
                {employeesLoading ? (
                  <div className="text-center py-8">로딩 중...</div>
                ) : employees.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">등록된 사용자가 없습니다.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>이름</TableHead>
                          <TableHead>이메일</TableHead>
                          <TableHead>버디</TableHead>
                          <TableHead>사물함</TableHead>
                          <TableHead>작업</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employees.map((employee) => (
                          <TableRow key={employee.id} data-testid={`row-employee-${employee.id}`}>
                            <TableCell data-testid={`text-employee-name-${employee.id}`}>
                              {employee.userName}
                            </TableCell>
                            <TableCell data-testid={`text-employee-email-${employee.id}`}>
                              {employee.email}
                            </TableCell>
                            <TableCell data-testid={`text-employee-buddy-${employee.id}`}>
                              {employee.buddyName}
                            </TableCell>
                            <TableCell data-testid={`text-employee-locker-${employee.id}`}>
                              {employee.lockerNumber}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-brand-blue hover:text-blue-800"
                                  data-testid={`button-edit-employee-${employee.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-brand-red hover:text-red-800"
                                  onClick={() => deleteEmployeeMutation.mutate(employee.id)}
                                  data-testid={`button-delete-employee-${employee.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            {/* Add Content Form */}
            <UploadForm />

            {/* Content Icons List */}
            <Card>
              <CardHeader>
                <CardTitle>생성된 콘텐츠 아이콘</CardTitle>
              </CardHeader>
              <CardContent>
                {contentLoading ? (
                  <div className="text-center py-8">로딩 중...</div>
                ) : contentIcons.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">생성된 콘텐츠가 없습니다.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {contentIcons.map((content) => (
                      <Card key={content.id} className="border border-gray-200" data-testid={`card-content-${content.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 bg-brand-blue rounded-lg flex items-center justify-center text-2xl">
                              {getContentTypeIcon(content.contentType)}
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-brand-blue hover:text-blue-800"
                                onClick={() => setEditingContent(content)}
                                data-testid={`button-edit-content-${content.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-brand-red hover:text-red-800"
                                onClick={() => deleteContentMutation.mutate(content.id)}
                                data-testid={`button-delete-content-${content.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <h4 className="font-medium text-gray-900" data-testid={`text-content-title-${content.id}`}>
                            {content.iconTitle}
                          </h4>
                          <p className="text-sm text-gray-500" data-testid={`text-content-type-${content.id}`}>
                            {content.contentType} • 순서: {content.displayOrder}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Content Modal */}
      {editingContent && (
        <Dialog open={true} onOpenChange={() => setEditingContent(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>콘텐츠 수정</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Input
                    name="iconTitle"
                    required
                    defaultValue={editingContent.iconTitle}
                    className="form-input peer"
                    placeholder=""
                    data-testid="input-edit-icon-title"
                  />
                  <Label className="form-label">아이콘 제목</Label>
                </div>
                <div className="relative">
                  <Select name="contentType" required defaultValue={editingContent.contentType}>
                    <SelectTrigger className="form-input pt-3" data-testid="select-edit-content-type">
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

              <div className="relative">
                <Input
                  name="contentSource"
                  defaultValue={editingContent.contentSource}
                  className="form-input peer"
                  placeholder=""
                  data-testid="input-edit-content-source"
                />
                <Label className="form-label">콘텐츠 소스 (URL)</Label>
              </div>

              <div className="relative w-32">
                <Input
                  name="displayOrder"
                  type="number"
                  required
                  min="1"
                  defaultValue={editingContent.displayOrder}
                  className="form-input peer"
                  placeholder=""
                  data-testid="input-edit-display-order"
                />
                <Label className="form-label">표시 순서</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingContent(null)}
                  data-testid="button-cancel-edit"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  className="bg-brand-navy hover:bg-blue-800 text-white"
                  disabled={updateContentMutation.isPending}
                  data-testid="button-save-edit"
                >
                  수정 완료
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
