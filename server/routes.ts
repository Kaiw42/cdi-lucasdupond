import type { Express, RequestHandler } from "express";
import type { Server } from "http";
import session from "express-session";
import multer from "multer";
import { storage } from "./storage";
import { insertSharedFileSchema, insertStudentNoteSchema } from "@shared/schema";
import { 
  findTeacherByCredentials, 
  findStudentByCredentials,
  addStudentCredential,
  deleteStudentCredential,
  getStudentCredentials,
  addTeacherCredential,
  deleteTeacherCredential,
  getTeacherCredentials,
  TeacherCredential,
} from "./credentials";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB max
  },
});

declare module "express-session" {
  interface SessionData {
    userId?: string;
    userRole?: "teacher" | "student";
    workstationId?: number;
    firstName?: string;
    lastName?: string;
    classe?: string;
  }
}

const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.session?.userId) {
    next();
  } else {
    res.status(401).json({ message: "Non authentifié" });
  }
};

const isTeacher: RequestHandler = (req, res, next) => {
  if (req.session?.userRole === "teacher") {
    next();
  } else {
    res.status(403).json({ message: "Accès réservé aux professeurs" });
  }
};

const isStudent: RequestHandler = (req, res, next) => {
  if (req.session?.userRole === "student") {
    next();
  } else {
    res.status(403).json({ message: "Accès réservé aux élèves" });
  }
};

export async function registerRoutes(httpServer: Server, app: Express): Promise<void> {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "edulinux-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );

  await storage.initializeWorkstations();

  app.post("/api/auth/teacher/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Identifiant et mot de passe requis" });
      }

      const teacher = findTeacherByCredentials(username, password);
      
      if (!teacher) {
        return res.status(401).json({ message: "Identifiants incorrects" });
      }

      let user = await storage.getUserByUsername(username);
      if (!user) {
        user = await storage.upsertUser({
          id: teacher.id,
          username: teacher.username,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          role: "teacher",
        });
      }

      req.session.userId = teacher.id;
      req.session.userRole = "teacher";
      req.session.firstName = teacher.firstName;
      req.session.lastName = teacher.lastName;

      res.json({
        id: teacher.id,
        username: teacher.username,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        role: "teacher",
      });
    } catch (error) {
      console.error("Teacher login error:", error);
      res.status(500).json({ message: "Erreur de connexion" });
    }
  });

  app.post("/api/auth/student/login", async (req, res) => {
    try {
      const { username, password, workstationId } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Identifiant et mot de passe requis" });
      }

      if (!workstationId || typeof workstationId !== "number") {
        return res.status(400).json({ message: "Poste de travail non sélectionné" });
      }

      const student = findStudentByCredentials(username, password);
      
      if (!student) {
        return res.status(401).json({ message: "Identifiants incorrects" });
      }

      const workstation = await storage.getWorkstation(workstationId);
      if (!workstation) {
        return res.status(404).json({ message: "Poste de travail introuvable" });
      }

      if (workstation.isOccupied) {
        return res.status(409).json({ message: "Ce poste est déjà occupé" });
      }

      let user = await storage.getUserByUsername(username);
      if (!user) {
        user = await storage.upsertUser({
          id: student.id,
          username: student.username,
          firstName: student.firstName,
          lastName: student.lastName,
          role: "student",
          classe: student.classe,
        });
      }

      await storage.claimWorkstation(
        workstationId,
        student.id,
        `${student.firstName} ${student.lastName}`
      );
      await storage.updateUserStatus(student.id, true, workstationId);

      req.session.userId = student.id;
      req.session.userRole = "student";
      req.session.workstationId = workstationId;
      req.session.firstName = student.firstName;
      req.session.lastName = student.lastName;
      req.session.classe = student.classe;

      res.json({
        id: student.id,
        username: student.username,
        firstName: student.firstName,
        lastName: student.lastName,
        role: "student",
        classe: student.classe,
        workstationId,
        isLocked: workstation.isLocked,
      });
    } catch (error) {
      console.error("Student login error:", error);
      res.status(500).json({ message: "Erreur de connexion" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      if (req.session?.userRole === "student" && req.session.workstationId) {
        await storage.releaseWorkstation(req.session.workstationId);
        if (req.session.userId) {
          await storage.updateUserStatus(req.session.userId, false);
        }
      }

      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
          return res.status(500).json({ message: "Erreur de déconnexion" });
        }
        res.json({ success: true });
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Erreur de déconnexion" });
    }
  });

  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      let workstationLocked = false;
      if (req.session.workstationId) {
        const ws = await storage.getWorkstation(req.session.workstationId);
        workstationLocked = ws?.isLocked || false;
      }

      res.json({
        ...user,
        workstationId: req.session.workstationId,
        isLocked: workstationLocked,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Erreur" });
    }
  });

  app.get("/api/workstations", async (req, res) => {
    try {
      const workstations = await storage.getWorkstations();
      res.json(workstations);
    } catch (error) {
      console.error("Get workstations error:", error);
      res.status(500).json({ message: "Erreur" });
    }
  });

  app.get("/api/students", isAuthenticated, isTeacher, async (req, res) => {
    try {
      const workstations = await storage.getWorkstations();
      const occupiedWorkstations = workstations.filter(w => w.isOccupied);
      res.json(occupiedWorkstations.map(w => ({
        id: w.currentStudentId,
        name: w.currentStudentName,
        workstationId: w.id,
        workstationLabel: w.label,
        isLocked: w.isLocked,
      })));
    } catch (error) {
      console.error("Get students error:", error);
      res.status(500).json({ message: "Erreur" });
    }
  });

  app.post("/api/workstations/:id/lock", isAuthenticated, isTeacher, async (req, res) => {
    try {
      const workstationId = parseInt(req.params.id);
      const { locked } = req.body;
      await storage.lockWorkstation(workstationId, locked);
      res.json({ success: true });
    } catch (error) {
      console.error("Lock workstation error:", error);
      res.status(500).json({ message: "Erreur" });
    }
  });

  app.post("/api/workstations/lock-all", isAuthenticated, isTeacher, async (req, res) => {
    try {
      const { locked } = req.body;
      await storage.lockAllWorkstations(locked);
      res.json({ success: true });
    } catch (error) {
      console.error("Lock all workstations error:", error);
      res.status(500).json({ message: "Erreur" });
    }
  });

  app.post("/api/students/:id/disconnect", isAuthenticated, isTeacher, async (req, res) => {
    try {
      const studentId = req.params.id;
      const workstations = await storage.getWorkstations();
      const studentWs = workstations.find(w => w.currentStudentId === studentId);
      if (studentWs) {
        await storage.releaseWorkstation(studentWs.id);
      }
      await storage.updateUserStatus(studentId, false);
      res.json({ success: true });
    } catch (error) {
      console.error("Disconnect student error:", error);
      res.status(500).json({ message: "Erreur" });
    }
  });

  app.get("/api/shared-files", isAuthenticated, async (req, res) => {
    try {
      if (req.session.classe) {
        const files = await storage.getSharedFilesByClasses([req.session.classe]);
        res.json(files);
      } else {
        res.json([]);
      }
    } catch (error) {
      console.error("Get shared files error:", error);
      res.status(500).json({ message: "Erreur" });
    }
  });

  app.get("/api/shared-files/teacher", isAuthenticated, isTeacher, async (req, res) => {
    try {
      const files = await storage.getSharedFiles();
      res.json(files);
    } catch (error) {
      console.error("Get shared files error:", error);
      res.status(500).json({ message: "Erreur" });
    }
  });

  app.post("/api/shared-files", isAuthenticated, isTeacher, async (req, res) => {
    try {
      const parseResult = insertSharedFileSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ message: "Données invalides", errors: parseResult.error });
      }
      
      const file = await storage.createSharedFile({
        ...parseResult.data,
        createdBy: req.session.userId,
      });
      res.json(file);
    } catch (error) {
      console.error("Create shared file error:", error);
      res.status(500).json({ message: "Erreur" });
    }
  });

  app.delete("/api/shared-files/:id", isAuthenticated, isTeacher, async (req, res) => {
    try {
      await storage.deleteSharedFile(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete shared file error:", error);
      res.status(500).json({ message: "Erreur" });
    }
  });

  app.post("/api/shared-files/upload", isAuthenticated, isTeacher, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Aucun fichier fourni" });
      }

      const { targetClasses, parentId } = req.body;
      let parsedClasses: string[] = [];
      try {
        parsedClasses = targetClasses ? JSON.parse(targetClasses) : [];
        if (!Array.isArray(parsedClasses)) {
          return res.status(400).json({ message: "Format de classes invalide" });
        }
      } catch {
        return res.status(400).json({ message: "Format de classes invalide" });
      }

      if (parsedClasses.length === 0) {
        return res.status(400).json({ message: "Sélectionnez au moins une classe" });
      }

      const fileContent = req.file.buffer.toString("base64");
      
      const file = await storage.createSharedFile({
        name: req.file.originalname,
        content: fileContent,
        fileType: "file",
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        parentId: parentId || null,
        targetClasses: parsedClasses,
        createdBy: req.session.userId,
      });

      res.json(file);
    } catch (error) {
      console.error("Upload file error:", error);
      res.status(500).json({ message: "Erreur lors de l'upload" });
    }
  });

  app.get("/api/shared-files/:id/download", isAuthenticated, async (req, res) => {
    try {
      const files = await storage.getSharedFiles();
      const file = files.find(f => f.id === req.params.id);
      
      if (!file) {
        return res.status(404).json({ message: "Fichier non trouvé" });
      }

      if (req.session.classe && file.targetClasses && !file.targetClasses.includes(req.session.classe)) {
        return res.status(403).json({ message: "Accès non autorisé" });
      }

      if (!file.content) {
        return res.status(404).json({ message: "Contenu non disponible" });
      }

      const buffer = Buffer.from(file.content, "base64");
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(file.name)}"`);
      res.setHeader("Content-Type", file.mimeType || "application/octet-stream");
      res.setHeader("Content-Length", buffer.length);
      res.send(buffer);
    } catch (error) {
      console.error("Download file error:", error);
      res.status(500).json({ message: "Erreur" });
    }
  });

  app.get("/api/student-files", isAuthenticated, isStudent, async (req, res) => {
    try {
      const files = await storage.getStudentFiles(req.session.userId!);
      res.json(files);
    } catch (error) {
      console.error("Get student files error:", error);
      res.status(500).json({ message: "Erreur" });
    }
  });

  app.post("/api/student-files", isAuthenticated, isStudent, async (req, res) => {
    try {
      const file = await storage.createStudentFile({
        ...req.body,
        ownerId: req.session.userId,
      });
      res.json(file);
    } catch (error) {
      console.error("Create student file error:", error);
      res.status(500).json({ message: "Erreur" });
    }
  });

  app.patch("/api/student-files/:id", isAuthenticated, isStudent, async (req, res) => {
    try {
      const { content } = req.body;
      if (typeof content !== "string") {
        return res.status(400).json({ message: "Contenu requis" });
      }
      const file = await storage.updateStudentFile(req.params.id, content);
      if (!file) {
        return res.status(404).json({ message: "Fichier non trouvé" });
      }
      res.json(file);
    } catch (error) {
      console.error("Update student file error:", error);
      res.status(500).json({ message: "Erreur" });
    }
  });

  app.delete("/api/student-files/:id", isAuthenticated, isStudent, async (req, res) => {
    try {
      await storage.deleteStudentFile(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete student file error:", error);
      res.status(500).json({ message: "Erreur" });
    }
  });

  app.get("/api/student-notes", isAuthenticated, isStudent, async (req, res) => {
    try {
      const notes = await storage.getStudentNotes(req.session.userId!);
      res.json(notes);
    } catch (error) {
      console.error("Get student notes error:", error);
      res.status(500).json({ message: "Erreur" });
    }
  });

  app.post("/api/student-notes", isAuthenticated, isStudent, async (req, res) => {
    try {
      const note = await storage.createStudentNote({
        ...req.body,
        ownerId: req.session.userId,
      });
      res.json(note);
    } catch (error) {
      console.error("Create student note error:", error);
      res.status(500).json({ message: "Erreur" });
    }
  });

  app.patch("/api/student-notes/:id", isAuthenticated, isStudent, async (req, res) => {
    try {
      const note = await storage.updateStudentNote(req.params.id, req.body);
      res.json(note);
    } catch (error) {
      console.error("Update student note error:", error);
      res.status(500).json({ message: "Erreur" });
    }
  });

  app.delete("/api/student-notes/:id", isAuthenticated, isStudent, async (req, res) => {
    try {
      await storage.deleteStudentNote(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete student note error:", error);
      res.status(500).json({ message: "Erreur" });
    }
  });

  app.get("/api/screen-sharing", isAuthenticated, async (req, res) => {
    try {
      if (!req.session.classe) {
        return res.json(null);
      }
      
      const sharing = await storage.getActiveScreenSharing();
      
      if (sharing && sharing.targetClasses?.includes(req.session.classe)) {
        res.json(sharing);
      } else {
        res.json(null);
      }
    } catch (error) {
      console.error("Get screen sharing error:", error);
      res.status(500).json({ message: "Erreur" });
    }
  });

  app.get("/api/screen-sharing/status", isAuthenticated, isTeacher, async (req, res) => {
    try {
      const sharing = await storage.getActiveScreenSharing();
      res.json(sharing);
    } catch (error) {
      console.error("Get screen sharing status error:", error);
      res.status(500).json({ message: "Erreur" });
    }
  });

  app.post("/api/screen-sharing", isAuthenticated, isTeacher, async (req, res) => {
    try {
      const sharing = await storage.updateScreenSharing({
        teacherId: req.session.userId,
        ...req.body,
      });
      res.json(sharing);
    } catch (error) {
      console.error("Update screen sharing error:", error);
      res.status(500).json({ message: "Erreur" });
    }
  });

  app.get("/api/workstation/status", isAuthenticated, isStudent, async (req, res) => {
    try {
      if (!req.session.workstationId) {
        return res.json({ isLocked: false, workstationId: null });
      }
      const ws = await storage.getWorkstation(req.session.workstationId);
      res.json({ 
        isLocked: ws?.isLocked || false, 
        workstationId: req.session.workstationId 
      });
    } catch (error) {
      console.error("Get workstation status error:", error);
      res.status(500).json({ message: "Erreur" });
    }
  });

  app.post("/api/workstation/activity", isAuthenticated, isStudent, async (req, res) => {
    try {
      if (!req.session.workstationId) {
        return res.status(400).json({ message: "Pas de poste associé" });
      }
      const { activity } = req.body;
      await storage.updateWorkstationActivity(req.session.workstationId, activity || null);
      res.json({ success: true });
    } catch (error) {
      console.error("Update activity error:", error);
      res.status(500).json({ message: "Erreur" });
    }
  });

  app.get("/api/student-accounts", isAuthenticated, isTeacher, async (req, res) => {
    try {
      const students = getStudentCredentials();
      res.json(students.map(s => ({
        id: s.id,
        username: s.username,
        firstName: s.firstName,
        lastName: s.lastName,
        classe: s.classe,
      })));
    } catch (error) {
      console.error("Get student accounts error:", error);
      res.status(500).json({ message: "Erreur" });
    }
  });

  app.post("/api/student-accounts", isAuthenticated, isTeacher, async (req, res) => {
    try {
      const { username, password, firstName, lastName, classe } = req.body;
      
      if (!username || !password || !firstName || !lastName || !classe) {
        return res.status(400).json({ message: "Tous les champs sont requis" });
      }

      const existing = getStudentCredentials().find(s => s.username === username);
      if (existing) {
        return res.status(409).json({ message: "Cet identifiant existe déjà" });
      }

      const newStudent = {
        id: `student-${Date.now()}`,
        username,
        password,
        firstName,
        lastName,
        classe,
      };

      addStudentCredential(newStudent);
      
      res.json({
        id: newStudent.id,
        username: newStudent.username,
        firstName: newStudent.firstName,
        lastName: newStudent.lastName,
        classe: newStudent.classe,
      });
    } catch (error) {
      console.error("Create student account error:", error);
      res.status(500).json({ message: "Erreur" });
    }
  });

  app.delete("/api/student-accounts/:username", isAuthenticated, isTeacher, async (req, res) => {
    try {
      const deleted = deleteStudentCredential(req.params.username);
      if (deleted) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Compte non trouvé" });
      }
    } catch (error) {
      console.error("Delete student account error:", error);
      res.status(500).json({ message: "Erreur" });
    }
  });

  app.get("/api/teacher-accounts", isAuthenticated, isTeacher, async (req, res) => {
    try {
      const teachers = getTeacherCredentials();
      res.json(teachers.map(t => ({
        id: t.id,
        username: t.username,
        firstName: t.firstName,
        lastName: t.lastName,
      })));
    } catch (error) {
      console.error("Get teacher accounts error:", error);
      res.status(500).json({ message: "Erreur" });
    }
  });

  app.post("/api/teacher-accounts", isAuthenticated, isTeacher, async (req, res) => {
    try {
      const { username, password, firstName, lastName } = req.body;
      
      if (!username || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "Tous les champs sont requis" });
      }

      const existing = getTeacherCredentials().find(t => t.username === username);
      if (existing) {
        return res.status(409).json({ message: "Cet identifiant existe déjà" });
      }

      const newTeacher: TeacherCredential = {
        id: `teacher-${Date.now()}`,
        username,
        password,
        firstName,
        lastName,
      };

      addTeacherCredential(newTeacher);
      
      res.json({
        id: newTeacher.id,
        username: newTeacher.username,
        firstName: newTeacher.firstName,
        lastName: newTeacher.lastName,
      });
    } catch (error) {
      console.error("Create teacher account error:", error);
      res.status(500).json({ message: "Erreur" });
    }
  });

  app.delete("/api/teacher-accounts/:username", isAuthenticated, isTeacher, async (req, res) => {
    try {
      const deleted = deleteTeacherCredential(req.params.username);
      if (deleted) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Compte non trouvé" });
      }
    } catch (error) {
      console.error("Delete teacher account error:", error);
      res.status(500).json({ message: "Erreur" });
    }
  });
}
