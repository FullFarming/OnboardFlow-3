import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertEmployeeSchema, insertContentIconSchema, insertContentImageSchema, insertUserProgressSchema, insertDepartmentSchema, insertManualSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { ragService } from "./services/ragService";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: (req, file, cb) => {
    // Allow all image formats for image fields
    if (file.fieldname === 'iconImage' || file.fieldname === 'images') {
      const allowedImageTypes = /jpeg|jpg|png|gif|webp|bmp|svg/;
      const fileExtension = allowedImageTypes.test(path.extname(file.originalname).toLowerCase());
      const mimeType = allowedImageTypes.test(file.mimetype);
      
      if (fileExtension && mimeType) {
        return cb(null, true);
      } else {
        return cb(new Error('이미지 파일만 업로드 가능합니다. (jpg, png, gif, webp, bmp, svg)'));
      }
    }
    
    // Allow any file type for contentFile (since it can be video, pdf, or image)
    if (file.fieldname === 'contentFile') {
      return cb(null, true);
    }
    
    cb(null, true);
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Employee management routes
  app.get("/api/employees", async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ error: "Failed to fetch employees" });
    }
  });

  app.post("/api/employees", async (req, res) => {
    try {
      const validatedData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(validatedData);
      res.status(201).json(employee);
    } catch (error) {
      console.error("Error creating employee:", error);
      res.status(400).json({ error: "Failed to create employee" });
    }
  });

  app.put("/api/employees/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertEmployeeSchema.partial().parse(req.body);
      const employee = await storage.updateEmployee(id, validatedData);
      res.json(employee);
    } catch (error) {
      console.error("Error updating employee:", error);
      res.status(400).json({ error: "Failed to update employee" });
    }
  });

  app.delete("/api/employees/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEmployee(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting employee:", error);
      res.status(400).json({ error: "Failed to delete employee" });
    }
  });

  // Employee login route
  app.post("/api/employee-login", async (req, res) => {
    try {
      const { userName, userPassword } = req.body;
      const employee = await storage.getEmployeeByUserName(userName);
      
      if (!employee || employee.userPassword !== userPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      res.json(employee);
    } catch (error) {
      console.error("Error during employee login:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Content icon management routes
  app.get("/api/content-icons", async (req, res) => {
    try {
      const contentIcons = await storage.getAllContentIcons();
      res.json(contentIcons);
    } catch (error) {
      console.error("Error fetching content icons:", error);
      res.status(500).json({ error: "Failed to fetch content icons" });
    }
  });

  app.post("/api/content-icons", upload.any(), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      // Find specific file types
      const iconImageFile = files?.find(f => f.fieldname === 'iconImage');
      const contentFile = files?.find(f => f.fieldname === 'contentFile');
      const slideImageFiles = files?.filter(f => f.fieldname.startsWith('slideImage_')) || [];
      
      // Handle contentSource - preserve JSON structure if it exists for Image content with metadata
      let finalContentSource = req.body.contentSource;
      
      // Handle single image content
      if (contentFile) {
        const fileUrl = `/uploads/${contentFile.filename}`;
        // Check if contentSource is JSON (contains caption or guide sentence data)
        if (req.body.contentSource && req.body.contentSource.startsWith('{')) {
          try {
            const parsed = JSON.parse(req.body.contentSource);
            // Update the URL in the JSON structure
            parsed.url = fileUrl;
            finalContentSource = JSON.stringify(parsed);
          } catch {
            // If parsing fails, just use the file URL
            finalContentSource = fileUrl;
          }
        } else {
          finalContentSource = fileUrl;
        }
      }
      
      // Handle slideshow content
      if (req.body.contentType === "Image Slideshow" && slideImageFiles.length > 0) {
        try {
          const slideshowData = JSON.parse(req.body.contentSource);
          
          // Update image URLs with actual uploaded file paths
          const updatedSlideshowData = slideshowData.map((slide: any, index: number) => {
            const slideFile = slideImageFiles.find(f => f.fieldname === `slideImage_${index}`);
            return {
              ...slide,
              imageUrl: slideFile ? `/uploads/${slideFile.filename}` : slide.imageUrl
            };
          });
          
          finalContentSource = JSON.stringify(updatedSlideshowData);
        } catch (error) {
          console.error("Error processing slideshow data:", error);
          throw new Error("Failed to process slideshow data");
        }
      }

      const contentIconData = {
        iconTitle: req.body.iconTitle,
        contentType: req.body.contentType,
        contentSource: finalContentSource,
        displayOrder: parseInt(req.body.displayOrder),
        iconImage: iconImageFile ? `/uploads/${iconImageFile.filename}` : req.body.iconImage,
      };

      const validatedData = insertContentIconSchema.parse(contentIconData);
      const contentIcon = await storage.createContentIcon(validatedData);
      
      // For single Image content with caption or guide sentence, also create content_images record
      if (contentIcon.contentType === "Image" && contentFile) {
        try {
          // Check if contentSource contains JSON with caption or guide sentence
          const parsedContent = JSON.parse(contentIcon.contentSource);
          if (parsedContent.caption || parsedContent.guideSentence) {
            const contentImageData = {
              contentId: contentIcon.id,
              imageUrl: parsedContent.url || contentIcon.contentSource,
              imageCaption: parsedContent.caption || "",
              guideSentence: parsedContent.guideSentence || "",
              imageOrder: 1,
            };
            
            const validatedImageData = insertContentImageSchema.parse(contentImageData);
            await storage.createContentImage(validatedImageData);
          }
        } catch (error) {
          // ContentSource is not JSON, no need to create content_images record
          console.log("ContentSource is not JSON, skipping content_images creation");
        }
      }
      
      // For Image Slideshow content, create content_images records for each slide
      if (contentIcon.contentType === "Image Slideshow") {
        try {
          const slideshowData = JSON.parse(contentIcon.contentSource);
          if (Array.isArray(slideshowData)) {
            for (const slide of slideshowData) {
              const contentImageData = {
                contentId: contentIcon.id,
                imageUrl: slide.imageUrl,
                imageCaption: slide.caption || "",
                guideSentence: slide.markdownContent || "",
                imageOrder: slide.order || 1,
              };
              
              const validatedImageData = insertContentImageSchema.parse(contentImageData);
              await storage.createContentImage(validatedImageData);
            }
          }
        } catch (error) {
          console.error("Error creating slideshow content_images:", error);
        }
      }
      
      res.status(201).json(contentIcon);
    } catch (error) {
      console.error("Error creating content icon:", error);
      res.status(400).json({ error: "Failed to create content icon" });
    }
  });

  app.put("/api/content-icons/:id", upload.fields([
    { name: 'iconImage', maxCount: 1 },
    { name: 'contentFile', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const { id } = req.params;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const iconImageFile = files?.iconImage?.[0];
      const contentFile = files?.contentFile?.[0];
      
      const updateData: any = {
        iconTitle: req.body.iconTitle,
        contentType: req.body.contentType,
        displayOrder: req.body.displayOrder ? parseInt(req.body.displayOrder) : undefined,
      };

      if (contentFile) {
        updateData.contentSource = `/uploads/${contentFile.filename}`;
      } else if (req.body.contentSource) {
        updateData.contentSource = req.body.contentSource;
      }

      if (iconImageFile) {
        updateData.iconImage = `/uploads/${iconImageFile.filename}`;
      } else if (req.body.iconImage) {
        updateData.iconImage = req.body.iconImage;
      }

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const validatedData = insertContentIconSchema.partial().parse(updateData);
      const contentIcon = await storage.updateContentIcon(id, validatedData);
      res.json(contentIcon);
    } catch (error) {
      console.error("Error updating content icon:", error);
      res.status(400).json({ error: "Failed to update content icon" });
    }
  });

  app.delete("/api/content-icons/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteContentIcon(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting content icon:", error);
      res.status(400).json({ error: "Failed to delete content icon" });
    }
  });

  // Content Images routes (for multi-image support)
  app.get("/api/content-images/:contentId", async (req, res) => {
    try {
      const { contentId } = req.params;
      const images = await storage.getContentImages(contentId);
      res.json(images);
    } catch (error) {
      console.error("Error fetching content images:", error);
      res.status(500).json({ error: "Failed to fetch content images" });
    }
  });

  app.post("/api/content-images", upload.array('images', 10), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      const { contentId, captions, guideSentences } = req.body;
      
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No images uploaded" });
      }

      // Parse captions and guide sentences - may come as string array from FormData
      const captionArray = Array.isArray(captions) ? captions : [captions];
      const guideSentenceArray = Array.isArray(guideSentences) ? guideSentences : [guideSentences];

      const createdImages = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const imageCaption = captionArray[i] || ""; // Use corresponding caption or empty string
        const guideSentence = guideSentenceArray[i] || ""; // Use corresponding guide sentence or empty string
        
        const imageData = {
          contentId,
          imageUrl: `/uploads/${file.filename}`,
          imageCaption,
          guideSentence,
          imageOrder: i + 1,
        };
        
        const validatedData = insertContentImageSchema.parse(imageData);
        const image = await storage.createContentImage(validatedData);
        createdImages.push(image);
      }
      
      res.status(201).json(createdImages);
    } catch (error) {
      console.error("Error creating content images:", error);
      res.status(400).json({ error: "Failed to create content images" });
    }
  });

  app.delete("/api/content-images/:contentId", async (req, res) => {
    try {
      const { contentId } = req.params;
      await storage.deleteContentImages(contentId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting content images:", error);
      res.status(400).json({ error: "Failed to delete content images" });
    }
  });

  // User Progress routes
  app.get("/api/progress/:employeeId", async (req, res) => {
    try {
      const { employeeId } = req.params;
      const progress = await storage.getUserProgress(employeeId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ error: "Failed to fetch user progress" });
    }
  });

  app.get("/api/progress-summary/:employeeId", async (req, res) => {
    try {
      const { employeeId } = req.params;
      const summary = await storage.getProgressSummary(employeeId);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching progress summary:", error);
      res.status(500).json({ error: "Failed to fetch progress summary" });
    }
  });

  app.post("/api/progress", async (req, res) => {
    try {
      const validatedData = insertUserProgressSchema.parse(req.body);
      const progress = await storage.createOrUpdateProgress(validatedData);
      res.status(201).json(progress);
    } catch (error) {
      console.error("Error updating progress:", error);
      res.status(400).json({ error: "Failed to update progress" });
    }
  });

  // Mark content as complete (idempotent)
  app.post("/api/content/mark-complete", async (req, res) => {
    try {
      const { contentId, employeeId } = req.body;
      
      if (!contentId || !employeeId) {
        return res.status(400).json({ error: "contentId and employeeId are required" });
      }

      const result = await storage.markContentComplete(employeeId, contentId);
      res.json(result);
    } catch (error) {
      console.error("Error marking content completion:", error);
      res.status(500).json({ error: "Failed to mark content completion" });
    }
  });

  // Serve uploaded files with proper headers for images
  app.use('/uploads', (req, res, next) => {
    const filePath = path.join(uploadDir, req.path);
    if (fs.existsSync(filePath)) {
      // Set proper headers for different file types
      const ext = path.extname(filePath).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'].includes(ext)) {
        res.setHeader('Content-Type', `image/${ext.substring(1)}`);
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }
      if (ext === '.pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }
      res.sendFile(filePath);
    } else {
      console.error(`File not found: ${filePath}`);
      res.status(404).json({ error: "File not found" });
    }
  });

  // ===========================================
  // MANUAL LIBRARY ROUTES
  // ===========================================

  // Department routes
  app.get("/api/departments", async (req, res) => {
    try {
      const departmentsList = await storage.getAllDepartments();
      res.json(departmentsList);
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).json({ error: "Failed to fetch departments" });
    }
  });

  app.post("/api/departments", async (req, res) => {
    try {
      const validatedData = insertDepartmentSchema.parse(req.body);
      const department = await storage.createDepartment(validatedData);
      res.status(201).json(department);
    } catch (error) {
      console.error("Error creating department:", error);
      res.status(400).json({ error: "Failed to create department" });
    }
  });

  app.put("/api/departments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const department = await storage.updateDepartment(id, req.body);
      res.json(department);
    } catch (error) {
      console.error("Error updating department:", error);
      res.status(400).json({ error: "Failed to update department" });
    }
  });

  app.delete("/api/departments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteDepartment(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting department:", error);
      res.status(400).json({ error: "Failed to delete department" });
    }
  });

  // Manual routes
  app.get("/api/manuals", async (req, res) => {
    try {
      const { departmentId, search } = req.query;
      const manualsList = await storage.getAllManuals({
        departmentId: departmentId as string,
        search: search as string,
      });
      res.json(manualsList);
    } catch (error) {
      console.error("Error fetching manuals:", error);
      res.status(500).json({ error: "Failed to fetch manuals" });
    }
  });

  app.get("/api/manuals/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const manual = await storage.getManual(id);
      if (!manual) {
        return res.status(404).json({ error: "Manual not found" });
      }
      res.json(manual);
    } catch (error) {
      console.error("Error fetching manual:", error);
      res.status(500).json({ error: "Failed to fetch manual" });
    }
  });

  // Upload PDF for manual
  const pdfUpload = multer({
    dest: uploadDir,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit for PDFs
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('PDF 파일만 업로드 가능합니다.'));
      }
    },
  });

  app.post("/api/manuals", pdfUpload.single('file'), async (req, res) => {
    try {
      const { title, departmentId, hashtags } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "PDF 파일이 필요합니다." });
      }

      // Parse hashtags from JSON string or comma-separated
      let hashtagArray: string[] = [];
      if (hashtags) {
        try {
          hashtagArray = JSON.parse(hashtags);
        } catch {
          hashtagArray = hashtags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
        }
      }

      // Rename file with original extension
      const ext = path.extname(file.originalname) || '.pdf';
      const newFilename = file.filename + ext;
      const newPath = path.join(uploadDir, newFilename);
      fs.renameSync(file.path, newPath);

      const fileUrl = `/uploads/${newFilename}`;

      const manual = await storage.createManual({
        title,
        departmentId,
        fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
        hashtags: hashtagArray,
      });

      res.status(201).json(manual);
    } catch (error) {
      console.error("Error creating manual:", error);
      res.status(400).json({ error: "Failed to create manual" });
    }
  });

  app.put("/api/manuals/:id", pdfUpload.single('file'), async (req, res) => {
    try {
      const { id } = req.params;
      const { title, departmentId, hashtags } = req.body;
      const file = req.file;

      const updateData: any = {};
      if (title) updateData.title = title;
      if (departmentId) updateData.departmentId = departmentId;
      
      if (hashtags) {
        try {
          updateData.hashtags = JSON.parse(hashtags);
        } catch {
          updateData.hashtags = hashtags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
        }
      }

      if (file) {
        const ext = path.extname(file.originalname) || '.pdf';
        const newFilename = file.filename + ext;
        const newPath = path.join(uploadDir, newFilename);
        fs.renameSync(file.path, newPath);

        updateData.fileUrl = `/uploads/${newFilename}`;
        updateData.fileName = file.originalname;
        updateData.fileSize = file.size;
      }

      const manual = await storage.updateManual(id, updateData);
      res.json(manual);
    } catch (error) {
      console.error("Error updating manual:", error);
      res.status(400).json({ error: "Failed to update manual" });
    }
  });

  app.delete("/api/manuals/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteManual(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting manual:", error);
      res.status(400).json({ error: "Failed to delete manual" });
    }
  });

  app.post("/api/manuals/:id/view", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.incrementManualViewCount(id);
      const manual = await storage.getManual(id);
      res.json({ viewCount: manual?.viewCount || 0 });
    } catch (error) {
      console.error("Error incrementing view count:", error);
      res.status(400).json({ error: "Failed to increment view count" });
    }
  });

  // Manual Links Routes
  app.get("/api/manual-links", async (req, res) => {
    try {
      const links = await storage.getAllManualLinks();
      res.json(links);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch manual links" });
    }
  });

  app.get("/api/manual-links/:manualId", async (req, res) => {
    try {
      const { manualId } = req.params;
      const links = await storage.getManualLinks(manualId);
      const linkedManuals = await Promise.all(
        links.map(async (link) => {
          const manual = await storage.getManual(link.linkedManualId);
          return manual ? { ...link, linkedManual: manual } : null;
        })
      );
      res.json(linkedManuals.filter(Boolean));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch manual links" });
    }
  });

  app.post("/api/manual-links", async (req, res) => {
    try {
      const { sourceManualId, linkedManualId } = req.body;
      if (!sourceManualId || !linkedManualId) {
        return res.status(400).json({ error: "sourceManualId and linkedManualId are required" });
      }
      if (sourceManualId === linkedManualId) {
        return res.status(400).json({ error: "Cannot link a manual to itself" });
      }
      const link = await storage.createManualLink({ sourceManualId, linkedManualId });
      res.json(link);
    } catch (error) {
      res.status(500).json({ error: "Failed to create manual link" });
    }
  });

  app.delete("/api/manual-links/:id", async (req, res) => {
    try {
      await storage.deleteManualLink(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete manual link" });
    }
  });

  // RAG Chatbot Routes
  app.post("/api/rag/setup", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: 'GEMINI_API_KEY 환경변수가 설정되지 않았습니다.' });
      }
      await ragService.initialize(apiKey);
      res.json({ message: 'RAG 시스템이 초기화되었습니다.', initialized: true });
    } catch (error) {
      console.error('RAG 초기화 오류:', error);
      res.status(500).json({ error: 'RAG 시스템 초기화에 실패했습니다.' });
    }
  });

  app.post("/api/rag/index-existing", async (req, res) => {
    try {
      const { filePath, filename } = req.body;
      if (!filePath || !filename) {
        return res.status(400).json({ error: '파일 경로와 이름이 필요합니다.' });
      }
      await ragService.indexDocument(filePath, filename);
      res.json({
        message: '문서가 성공적으로 인덱싱되었습니다.',
        filename: filename,
        documents: ragService.getIndexedDocuments()
      });
    } catch (error) {
      console.error('문서 인덱싱 오류:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : '문서 처리에 실패했습니다.' 
      });
    }
  });

  app.post("/api/rag/index-manual/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const manual = await storage.getManual(id);
      if (!manual) {
        return res.status(404).json({ error: '매뉴얼을 찾을 수 없습니다.' });
      }

      if (!ragService.getIsInitialized()) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
          await ragService.initialize(apiKey);
        } else {
          return res.status(400).json({ error: 'RAG 서비스가 초기화되지 않았습니다.' });
        }
      }

      const filePath = path.join(process.cwd(), manual.fileUrl.replace(/^\//, ''));
      await ragService.indexDocument(filePath, manual.fileName || 'document.pdf');
      
      res.json({
        message: '매뉴얼이 성공적으로 인덱싱되었습니다.',
        filename: manual.fileName,
        documents: ragService.getIndexedDocuments()
      });
    } catch (error) {
      console.error('매뉴얼 인덱싱 오류:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : '매뉴얼 인덱싱에 실패했습니다.' 
      });
    }
  });

  app.post("/api/rag/ask", async (req, res) => {
    try {
      const { question } = req.body;
      if (!question) {
        return res.status(400).json({ error: '질문이 필요합니다.' });
      }

      if (!ragService.getIsInitialized()) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
          await ragService.initialize(apiKey);
        } else {
          return res.status(400).json({ error: 'RAG 서비스가 초기화되지 않았습니다.' });
        }
      }

      const result = await ragService.generateAnswer(question);
      res.json({
        answer: result.answer,
        sources: result.sources
      });
    } catch (error) {
      console.error('질문 처리 오류:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : '답변 생성에 실패했습니다.' 
      });
    }
  });

  app.get("/api/rag/documents", (req, res) => {
    try {
      const documents = ragService.getIndexedDocuments();
      res.json({ documents });
    } catch (error) {
      console.error('문서 목록 조회 오류:', error);
      res.status(500).json({ error: '문서 목록을 가져올 수 없습니다.' });
    }
  });

  app.delete("/api/rag/documents/:filename", (req, res) => {
    try {
      const { filename } = req.params;
      ragService.removeDocument(decodeURIComponent(filename));
      res.json({ 
        message: '문서가 제거되었습니다.',
        documents: ragService.getIndexedDocuments()
      });
    } catch (error) {
      console.error('문서 제거 오류:', error);
      res.status(500).json({ error: '문서 제거에 실패했습니다.' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
