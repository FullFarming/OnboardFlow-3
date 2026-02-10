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
import { Shield, Users, Grid3X3, LogOut, Edit, Trash2, Plus, Upload, BookOpen, FileText, Hash, Eye, Link2, X } from "lucide-react";
import { type Employee, type ContentIcon, type Department, type Manual, type ManualLink } from "@shared/schema";
import UploadForm from "@/components/upload-form";
import dashboardBg from "@assets/image_1756257576204.png";

export default function AdminDashboard() {
  const { logoutMutation } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("users");
  const [editingContent, setEditingContent] = useState<ContentIcon | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editingManual, setEditingManual] = useState<Manual | null>(null);
  const [linkingManual, setLinkingManual] = useState<Manual | null>(null);
  const [newHashtag, setNewHashtag] = useState("");
  const [manualHashtags, setManualHashtags] = useState<string[]>([]);
  const [manualIcon, setManualIcon] = useState<string>("");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [editManualIcon, setEditManualIcon] = useState<string>("");
  const [editContentType, setEditContentType] = useState("");

  // Fetch employees
  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  // Fetch content icons
  const { data: contentIcons = [], isLoading: contentLoading } = useQuery<ContentIcon[]>({
    queryKey: ["/api/content-icons"],
  });

  // Fetch departments
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  // Fetch manuals
  const { data: manualsList = [], isLoading: manualsLoading } = useQuery<Manual[]>({
    queryKey: ["/api/manuals"],
  });

  // Fetch manual links for linking modal
  const { data: currentManualLinks = [] } = useQuery<Array<ManualLink & { linkedManual: Manual }>>({
    queryKey: ["/api/manual-links", linkingManual?.id],
    enabled: !!linkingManual,
    queryFn: async () => {
      const res = await fetch(`/api/manual-links/${linkingManual!.id}`);
      return res.json();
    }
  });

  const addManualLinkMutation = useMutation({
    mutationFn: async ({ sourceManualId, linkedManualId }: { sourceManualId: string; linkedManualId: string }) => {
      const response = await apiRequest("POST", "/api/manual-links", { sourceManualId, linkedManualId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manual-links", linkingManual?.id] });
      toast({ title: "매뉴얼이 연계되었습니다." });
    },
    onError: () => {
      toast({ title: "매뉴얼 연계 실패", variant: "destructive" });
    },
  });

  const deleteManualLinkMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/manual-links/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manual-links", linkingManual?.id] });
      toast({ title: "연계가 해제되었습니다." });
    },
    onError: () => {
      toast({ title: "연계 해제 실패", variant: "destructive" });
    },
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

  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/employees/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: "사용자 정보가 수정되었습니다." });
      setEditingEmployee(null);
    },
    onError: () => {
      toast({ title: "사용자 수정 실패", variant: "destructive" });
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

  const handleEmployeeEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingEmployee) return;
    
    const formData = new FormData(e.currentTarget);
    const data = {
      userName: formData.get("userName") as string,
      userPassword: formData.get("userPassword") as string,
      email: formData.get("email") as string,
      buddyName: formData.get("buddyName") as string,
      lockerNumber: formData.get("lockerNumber") as string,
      laptopInfo: formData.get("laptopInfo") as string,
    };
    
    updateEmployeeMutation.mutate({ id: editingEmployee.id, data });
  };

  // Manual mutations
  const addManualMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/manuals", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to create manual");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manuals"] });
      toast({ title: "매뉴얼이 성공적으로 추가되었습니다." });
      setManualHashtags([]);
    },
    onError: () => {
      toast({ title: "매뉴얼 추가 실패", variant: "destructive" });
    },
  });

  const updateManualMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      const response = await fetch(`/api/manuals/${id}`, {
        method: "PUT",
        body: data,
      });
      if (!response.ok) throw new Error("Failed to update manual");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manuals"] });
      toast({ title: "매뉴얼이 성공적으로 수정되었습니다." });
      setEditingManual(null);
      setManualHashtags([]);
    },
    onError: () => {
      toast({ title: "매뉴얼 수정 실패", variant: "destructive" });
    },
  });

  const deleteManualMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/manuals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manuals"] });
      toast({ title: "매뉴얼이 삭제되었습니다." });
    },
    onError: () => {
      toast({ title: "매뉴얼 삭제 실패", variant: "destructive" });
    },
  });

  const handleManualSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("hashtags", JSON.stringify(manualHashtags));
    if (manualIcon) formData.set("icon", manualIcon);
    addManualMutation.mutate(formData);
    e.currentTarget.reset();
    setManualHashtags([]);
    setManualIcon("");
  };

  const handleManualEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingManual) return;
    const formData = new FormData(e.currentTarget);
    formData.set("hashtags", JSON.stringify(manualHashtags));
    formData.set("icon", editManualIcon || "");
    updateManualMutation.mutate({ id: editingManual.id, data: formData });
  };

  const addHashtag = () => {
    const tag = newHashtag.trim().replace(/^#/, '');
    if (tag && !manualHashtags.includes(tag)) {
      setManualHashtags([...manualHashtags, tag]);
      setNewHashtag("");
    }
  };

  const removeHashtag = (tag: string) => {
    setManualHashtags(manualHashtags.filter(t => t !== tag));
  };

  const getDepartmentName = (deptId: string) => {
    const dept = departments.find(d => d.id === deptId);
    return dept?.name || "Unknown";
  };

  const getDepartmentColor = (deptId: string) => {
    const dept = departments.find(d => d.id === deptId);
    return dept?.color || "#3B82F6";
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "-";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
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
          <TabsList className="grid w-full grid-cols-3 max-w-xl">
            <TabsTrigger value="users" className="flex items-center gap-2" data-testid="tab-users">
              <Users className="h-4 w-4" />
              사용자 관리
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2" data-testid="tab-content">
              <Grid3X3 className="h-4 w-4" />
              콘텐츠 관리
            </TabsTrigger>
            <TabsTrigger value="manuals" className="flex items-center gap-2" data-testid="tab-manuals">
              <BookOpen className="h-4 w-4" />
              매뉴얼 관리
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
                                  onClick={() => setEditingEmployee(employee)}
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

          {/* Manuals Tab */}
          <TabsContent value="manuals" className="space-y-6">
            {/* Add Manual Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  신규 매뉴얼 등록
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">아이콘 선택</Label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowIconPicker(!showIconPicker)}
                        className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 flex items-center justify-center text-2xl transition-colors bg-white"
                      >
                        {manualIcon || <FileText className="h-5 w-5 text-gray-400" />}
                      </button>
                      <span className="text-sm text-gray-500">
                        {manualIcon ? "클릭하여 변경" : "클릭하여 아이콘 선택"}
                      </span>
                      {manualIcon && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => setManualIcon("")} className="text-gray-400 hover:text-gray-600 h-7 w-7 p-0">
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {showIconPicker && (
                      <div className="grid grid-cols-10 gap-1 p-3 bg-gray-50 rounded-lg border max-h-48 overflow-y-auto">
                        {["📄","📋","📑","📊","📈","📉","📝","📎","📌","📍","🔖","📁","📂","🗂️","🗄️","💼","🏢","🏗️","🔧","🔨","⚙️","🛠️","🔩","💡","🔑","🔒","🔓","🛡️","⚠️","✅","❌","❓","❗","💬","📞","📧","📩","📤","📥","🖨️","🖥️","💻","📱","🌐","🔗","📡","🏠","🚀","⭐","🎯","🎓","📚","📖","🧾","💰","💳","🏦","📆","⏰","🔔","🗓️","📏","📐","✏️","🖊️","🖋️","🔍","🔎","👥","👤","🤝","💪","🎉","🏆","🔥","💎","🌟","✨","💫","🌈"].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => { setManualIcon(emoji); setShowIconPicker(false); }}
                            className="w-8 h-8 flex items-center justify-center hover:bg-blue-100 rounded text-lg transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <Input
                        name="title"
                        required
                        className="form-input peer"
                        placeholder=""
                        data-testid="input-manual-title"
                      />
                      <Label className="form-label">매뉴얼 제목</Label>
                    </div>
                    <div className="relative">
                      <Select name="departmentId" required>
                        <SelectTrigger className="form-input">
                          <SelectValue placeholder="부서 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              <span className="flex items-center gap-2">
                                <span 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: dept.color || "#3B82F6" }}
                                />
                                {dept.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <Input
                      name="file"
                      type="file"
                      accept=".pdf"
                      required
                      className="form-input peer pt-2"
                      data-testid="input-manual-file"
                    />
                    <Label className="form-label">PDF 파일 (최대 20MB)</Label>
                  </div>

                  <div className="space-y-2">
                    <Label>해시태그</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newHashtag}
                        onChange={(e) => setNewHashtag(e.target.value)}
                        placeholder="#태그입력"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addHashtag();
                          }
                        }}
                        data-testid="input-manual-hashtag"
                      />
                      <Button type="button" variant="outline" onClick={addHashtag}>
                        <Hash className="h-4 w-4 mr-1" />
                        추가
                      </Button>
                    </div>
                    {manualHashtags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {manualHashtags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            #{tag}
                            <button
                              type="button"
                              onClick={() => removeHashtag(tag)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="bg-brand-navy hover:bg-blue-800 text-white"
                    disabled={addManualMutation.isPending}
                    data-testid="button-add-manual"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    매뉴얼 추가
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Manuals List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  등록된 매뉴얼 목록
                </CardTitle>
              </CardHeader>
              <CardContent>
                {manualsLoading ? (
                  <div className="text-center py-8 text-gray-500">로딩 중...</div>
                ) : manualsList.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">등록된 매뉴얼이 없습니다.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>제목</TableHead>
                        <TableHead>부서</TableHead>
                        <TableHead>해시태그</TableHead>
                        <TableHead>파일크기</TableHead>
                        <TableHead className="text-center">조회수</TableHead>
                        <TableHead className="text-right">관리</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {manualsList.map((manual) => (
                        <TableRow key={manual.id}>
                          <TableCell className="font-medium">
                            <a 
                              href={manual.fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-2"
                            >
                              {manual.icon && <span className="text-lg">{manual.icon}</span>}
                              {manual.title}
                            </a>
                          </TableCell>
                          <TableCell>
                            <span 
                              className="px-2 py-1 rounded text-white text-xs font-medium"
                              style={{ backgroundColor: getDepartmentColor(manual.departmentId) }}
                            >
                              {getDepartmentName(manual.departmentId)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {manual.hashtags?.slice(0, 3).map((tag) => (
                                <span key={tag} className="text-xs text-blue-600">#{tag}</span>
                              ))}
                              {manual.hashtags && manual.hashtags.length > 3 && (
                                <span className="text-xs text-gray-400">+{manual.hashtags.length - 3}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{formatFileSize(manual.fileSize)}</TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center gap-1">
                              <Eye className="h-3 w-3 text-gray-400" />
                              {manual.viewCount || 0}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-purple-600 hover:text-purple-800"
                              onClick={() => setLinkingManual(manual)}
                              title="매뉴얼 연계"
                            >
                              <Link2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-brand-blue hover:text-blue-800"
                              onClick={() => {
                                setEditingManual(manual);
                                setManualHashtags(manual.hashtags || []);
                                setEditManualIcon(manual.icon || "");
                                setShowIconPicker(false);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-brand-red hover:text-red-800"
                              onClick={() => deleteManualMutation.mutate(manual.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Content Modal */}
      {editingContent && (
        <Dialog open={true} onOpenChange={() => { setEditingContent(null); setEditContentType(""); }}>
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
                  <Select 
                    name="contentType" 
                    required 
                    defaultValue={editingContent.contentType}
                    onValueChange={(val) => setEditContentType(val)}
                  >
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

              {(editContentType || editingContent.contentType) === "PDF" ? (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1 block">PDF 파일 업로드</Label>
                    <Input
                      name="contentFile"
                      type="file"
                      accept="application/pdf"
                      className="cursor-pointer"
                    />
                    {editingContent.contentSource && editingContent.contentSource.startsWith('/uploads') && (
                      <p className="text-xs text-gray-500 mt-1">현재 파일: {editingContent.contentSource.split('/').pop()}</p>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      name="contentSource"
                      defaultValue={editingContent.contentSource}
                      className="form-input peer"
                      placeholder=""
                      data-testid="input-edit-content-source"
                    />
                    <Label className="form-label">또는 PDF URL 입력</Label>
                  </div>
                </div>
              ) : (
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
              )}

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
                  onClick={() => { setEditingContent(null); setEditContentType(""); }}
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

      {/* Edit Employee Modal */}
      {editingEmployee && (
        <Dialog open={true} onOpenChange={() => setEditingEmployee(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>사용자 정보 수정</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEmployeeEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Input
                    name="userName"
                    required
                    defaultValue={editingEmployee.userName}
                    className="form-input peer"
                    placeholder=""
                    data-testid="input-edit-employee-name"
                  />
                  <Label className="form-label">이름 (한글)</Label>
                </div>
                <div className="relative">
                  <Input
                    name="userPassword"
                    required
                    defaultValue={editingEmployee.userPassword}
                    maxLength={4}
                    pattern="[0-9]{4}"
                    className="form-input peer"
                    placeholder=""
                    data-testid="input-edit-employee-password"
                  />
                  <Label className="form-label">휴대폰 번호 뒷 4자리</Label>
                </div>
              </div>

              <div className="relative">
                <Input
                  name="email"
                  type="email"
                  defaultValue={editingEmployee.email || ""}
                  className="form-input peer"
                  placeholder=""
                  data-testid="input-edit-employee-email"
                />
                <Label className="form-label">이메일</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Input
                    name="buddyName"
                    defaultValue={editingEmployee.buddyName || ""}
                    className="form-input peer"
                    placeholder=""
                    data-testid="input-edit-employee-buddy"
                  />
                  <Label className="form-label">버디 이름</Label>
                </div>
                <div className="relative">
                  <Input
                    name="lockerNumber"
                    defaultValue={editingEmployee.lockerNumber || ""}
                    className="form-input peer"
                    placeholder=""
                    data-testid="input-edit-employee-locker"
                  />
                  <Label className="form-label">락커 번호</Label>
                </div>
              </div>

              <div className="relative">
                <Input
                  name="laptopInfo"
                  defaultValue={editingEmployee.laptopInfo || ""}
                  className="form-input peer"
                  placeholder=""
                  data-testid="input-edit-employee-laptop"
                />
                <Label className="form-label">노트북 정보</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingEmployee(null)}
                  data-testid="button-cancel-employee-edit"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  className="bg-brand-navy hover:bg-blue-800 text-white"
                  disabled={updateEmployeeMutation.isPending}
                  data-testid="button-save-employee-edit"
                >
                  수정 완료
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Manual Modal */}
      {editingManual && (
        <Dialog open={true} onOpenChange={() => { setEditingManual(null); setManualHashtags([]); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>매뉴얼 수정</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleManualEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">아이콘 선택</Label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 flex items-center justify-center text-2xl transition-colors bg-white"
                  >
                    {editManualIcon || <FileText className="h-5 w-5 text-gray-400" />}
                  </button>
                  <span className="text-sm text-gray-500">
                    {editManualIcon ? "클릭하여 변경" : "클릭하여 아이콘 선택"}
                  </span>
                  {editManualIcon && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setEditManualIcon("")} className="text-gray-400 hover:text-gray-600 h-7 w-7 p-0">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {showIconPicker && (
                  <div className="grid grid-cols-10 gap-1 p-3 bg-gray-50 rounded-lg border max-h-48 overflow-y-auto">
                    {["📄","📋","📑","📊","📈","📉","📝","📎","📌","📍","🔖","📁","📂","🗂️","🗄️","💼","🏢","🏗️","🔧","🔨","⚙️","🛠️","🔩","💡","🔑","🔒","🔓","🛡️","⚠️","✅","❌","❓","❗","💬","📞","📧","📩","📤","📥","🖨️","🖥️","💻","📱","🌐","🔗","📡","🏠","🚀","⭐","🎯","🎓","📚","📖","🧾","💰","💳","🏦","📆","⏰","🔔","🗓️","📏","📐","✏️","🖊️","🖋️","🔍","🔎","👥","👤","🤝","💪","🎉","🏆","🔥","💎","🌟","✨","💫","🌈"].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => { setEditManualIcon(emoji); setShowIconPicker(false); }}
                        className="w-8 h-8 flex items-center justify-center hover:bg-blue-100 rounded text-lg transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Input
                    name="title"
                    required
                    defaultValue={editingManual.title}
                    className="form-input peer"
                    placeholder=""
                    data-testid="input-edit-manual-title"
                  />
                  <Label className="form-label">매뉴얼 제목</Label>
                </div>
                <div className="relative">
                  <Select name="departmentId" defaultValue={editingManual.departmentId}>
                    <SelectTrigger className="form-input">
                      <SelectValue placeholder="부서 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          <span className="flex items-center gap-2">
                            <span 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: dept.color || "#3B82F6" }}
                            />
                            {dept.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="relative">
                <Input
                  name="file"
                  type="file"
                  accept=".pdf"
                  className="form-input peer pt-2"
                  data-testid="input-edit-manual-file"
                />
                <Label className="form-label">새 PDF 파일 (선택사항)</Label>
                <p className="text-sm text-gray-500 mt-1">현재 파일: {editingManual.fileName}</p>
              </div>

              <div className="space-y-2">
                <Label>해시태그</Label>
                <div className="flex gap-2">
                  <Input
                    value={newHashtag}
                    onChange={(e) => setNewHashtag(e.target.value)}
                    placeholder="#태그입력"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addHashtag();
                      }
                    }}
                    data-testid="input-edit-manual-hashtag"
                  />
                  <Button type="button" variant="outline" onClick={addHashtag}>
                    <Hash className="h-4 w-4 mr-1" />
                    추가
                  </Button>
                </div>
                {manualHashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {manualHashtags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeHashtag(tag)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setEditingManual(null); setManualHashtags([]); }}
                  data-testid="button-cancel-manual-edit"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  className="bg-brand-navy hover:bg-blue-800 text-white"
                  disabled={updateManualMutation.isPending}
                  data-testid="button-save-manual-edit"
                >
                  수정 완료
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Manual Linking Dialog */}
      {linkingManual && (
        <Dialog open={true} onOpenChange={() => setLinkingManual(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-purple-600" />
                매뉴얼 연계 관리
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-purple-800">
                  기준 매뉴얼: {linkingManual.title}
                </p>
              </div>

              {/* Current Links */}
              <div>
                <h4 className="text-sm font-medium mb-2">현재 연계된 매뉴얼</h4>
                {currentManualLinks.length === 0 ? (
                  <p className="text-sm text-gray-500 py-2">연계된 매뉴얼이 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {currentManualLinks.map((link) => (
                      <div key={link.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-sm">{link.linkedManual?.title || '삭제된 매뉴얼'}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 h-7 w-7 p-0"
                          onClick={() => deleteManualLinkMutation.mutate(link.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Link */}
              <div>
                <h4 className="text-sm font-medium mb-2">매뉴얼 연계 추가</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {manualsList
                    .filter(m => m.id !== linkingManual.id && !currentManualLinks.some(l => l.linkedManualId === m.id))
                    .map((manual) => (
                      <div key={manual.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg border">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{manual.title}</p>
                          <span 
                            className="text-xs px-1.5 py-0.5 rounded text-white"
                            style={{ backgroundColor: getDepartmentColor(manual.departmentId) }}
                          >
                            {getDepartmentName(manual.departmentId)}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-purple-600 border-purple-300 hover:bg-purple-50"
                          onClick={() => addManualLinkMutation.mutate({
                            sourceManualId: linkingManual.id,
                            linkedManualId: manual.id
                          })}
                          disabled={addManualLinkMutation.isPending}
                        >
                          <Link2 className="h-3 w-3 mr-1" />
                          연계
                        </Button>
                      </div>
                    ))}
                  {manualsList.filter(m => m.id !== linkingManual.id && !currentManualLinks.some(l => l.linkedManualId === m.id)).length === 0 && (
                    <p className="text-sm text-gray-500 py-2">연계 가능한 매뉴얼이 없습니다.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setLinkingManual(null)}>
                  닫기
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
