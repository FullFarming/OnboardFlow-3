import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertEmployeeSchema, insertContentIconSchema, insertContentImageSchema, insertUserProgressSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
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

  app.post("/api/content-icons", upload.fields([
    { name: 'iconImage', maxCount: 1 },
    { name: 'contentFile', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const iconImageFile = files?.iconImage?.[0];
      const contentFile = files?.contentFile?.[0];
      
      // Handle contentSource - preserve JSON structure if it exists for Image content with metadata
      let finalContentSource = req.body.contentSource;
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
      res.sendFile(filePath);
    } else {
      console.error(`File not found: ${filePath}`);
      res.status(404).json({ error: "File not found" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
