import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`로그인 시도: username=${username}`);
        const user = await storage.getUserByUsername(username);
        if (!user) {
          console.log(`사용자를 찾을 수 없음: ${username}`);
          return done(null, false, { message: '사용자를 찾을 수 없습니다.' });
        }
        
        const passwordMatch = await comparePasswords(password, user.password);
        console.log(`비밀번호 확인 결과: ${passwordMatch}`);
        
        if (!passwordMatch) {
          console.log(`비밀번호가 일치하지 않음: ${username}`);
          return done(null, false, { message: '비밀번호가 올바르지 않습니다.' });
        }
        
        console.log(`로그인 성공: ${username}`);
        return done(null, user);
      } catch (error) {
        console.error('로그인 처리 중 오류:', error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password),
    });

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });

  app.post("/api/login", (req, res, next) => {
    console.log('로그인 요청 받음:', req.body);
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        console.error('로그인 인증 오류:', err);
        return res.status(500).json({ error: "로그인 처리 중 오류가 발생했습니다." });
      }
      if (!user) {
        console.log('로그인 실패:', info?.message || '알 수 없는 오류');
        return res.status(401).json({ error: info?.message || "로그인에 실패했습니다." });
      }
      req.logIn(user, (err) => {
        if (err) {
          console.error('세션 생성 오류:', err);
          return res.status(500).json({ error: "세션 생성 중 오류가 발생했습니다." });
        }
        console.log('로그인 성공:', user.username);
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
