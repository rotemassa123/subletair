import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getUserById } from "./db.js";

const JWT_SECRET = resolveJwtSecret();

function resolveJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production");
  }
  return "subletair-dev-secret-change-me";
}
const TOKEN_TTL = "7d";

export function hashPassword(plain) {
  return bcrypt.hashSync(plain, 10);
}
export function verifyPassword(plain, hash) {
  return bcrypt.compareSync(plain, hash);
}
export function signToken(user) {
  return jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function userFromHeader(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  return getUserById(payload.id) || null;
}

export function authOptional(req, _res, next) {
  req.user = userFromHeader(req);
  next();
}

export function authRequired(req, res, next) {
  const user = userFromHeader(req);
  if (!user) return res.status(401).json({ error: "Authentication required" });
  req.user = user;
  next();
}
