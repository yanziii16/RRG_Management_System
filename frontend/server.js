import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import {
  INITIAL_ACCOMMODATIONS,
  INITIAL_FACILITIES,
  INITIAL_GALLERY,
  INITIAL_GUEST_COUNTS,
  INITIAL_PAYMENTS,
  INITIAL_RENTALS,
  INITIAL_RESERVATIONS,
  INITIAL_SETTINGS,
  INITIAL_USERS
} from "./src/data/mockData.js";
import {
  calculateReservationPricing,
  checkAccommodationAvailability
} from "./src/utils/calculations.js";
const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const UPLOAD_DIR = path.resolve(process.cwd(), "public", "uploads");
const TOKEN_SECRET = process.env.JWT_SECRET || "luckystar-dev-session-secret";
function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
function loadDb() {
  ensureDirs();
  if (!fs.existsSync(DB_FILE)) {
    const seeded = {
      users: INITIAL_USERS,
      accommodations: INITIAL_ACCOMMODATIONS,
      facilities: INITIAL_FACILITIES,
      gallery: INITIAL_GALLERY,
      rentals: INITIAL_RENTALS,
      reservations: INITIAL_RESERVATIONS,
      payments: INITIAL_PAYMENTS,
      guestCounts: INITIAL_GUEST_COUNTS,
      settings: INITIAL_SETTINGS
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(seeded, null, 2), "utf8");
    return seeded;
  }
  const raw = fs.readFileSync(DB_FILE, "utf8");
  return JSON.parse(raw);
}
function saveDb(state) {
  ensureDirs();
  fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf8");
}
function signToken(payload) {
  const data = Buffer.from(
    JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1e3 })
  ).toString("base64url");
  const sig = crypto.createHmac("sha256", TOKEN_SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}
function verifyToken(token) {
  try {
    const [data, sig] = token.split(".");
    if (!data || !sig) return null;
    const expected = crypto.createHmac("sha256", TOKEN_SECRET).update(data).digest("base64url");
    if (sig !== expected) return null;
    const parsed = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (parsed.exp && Date.now() > parsed.exp) return null;
    if (parsed.role !== "ADMIN" && parsed.role !== "GUEST") return null;
    return { userId: parsed.userId, role: parsed.role, email: parsed.email };
  } catch {
    return null;
  }
}
function sanitizeUser(user) {
  const { password: _pwd, ...safe } = user;
  return safe;
}
function attachAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    const token = header.slice(7);
    const verified = verifyToken(token);
    if (verified) req.auth = verified;
  }
  next();
}
function requireAuth(req, res, next) {
  if (!req.auth) {
    res.status(401).json({ message: "Authentication required. Please log in." });
    return;
  }
  next();
}
function requireAdmin(req, res, next) {
  if (!req.auth) {
    res.status(401).json({ message: "Admin authentication required." });
    return;
  }
  if (req.auth.role !== "ADMIN") {
    res.status(403).json({ message: "Forbidden. Administrator access only." });
    return;
  }
  next();
}
function recalculateReservationPayments(db, reservationId) {
  const resIdx = db.reservations.findIndex((r) => r.id === reservationId);
  if (resIdx === -1) return;
  const reservation = db.reservations[resIdx];
  const relatedPayments = db.payments.filter((p) => p.reservationId === reservationId);
  const approvedPaid = relatedPayments.filter((p) => p.status === "Approved").reduce((sum, p) => sum + p.amount, 0);
  const hasPending = relatedPayments.some((p) => p.status === "Pending Verification");
  const roundedPaid = Math.round(approvedPaid * 100) / 100;
  const balance = Math.max(0, Math.round((reservation.totalAmount - roundedPaid) * 100) / 100);
  let paymentStatus = "Unpaid";
  if (balance <= 0 && roundedPaid > 0) {
    paymentStatus = "Paid";
  } else if (hasPending && roundedPaid === 0) {
    paymentStatus = "Pending Verification";
  } else if (roundedPaid > 0 && balance > 0) {
    paymentStatus = hasPending ? "Pending Verification" : "Partially Paid";
  }
  db.reservations[resIdx] = {
    ...reservation,
    amountPaid: roundedPaid,
    balance,
    paymentStatus,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function startServer() {
  const app = express();
  app.use(express.json({ limit: "12mb" }));
  app.use("/uploads", express.static(UPLOAD_DIR));
  app.use(attachAuth);
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "luckystar-resort-api" });
  });
  app.get("/api/settings", (_req, res) => {
    const db = loadDb();
    res.json(db.settings);
  });
  app.put("/api/settings", requireAdmin, (req, res) => {
    const db = loadDb();
    db.settings = { ...db.settings, ...req.body };
    saveDb(db);
    res.json(db.settings);
  });
  app.post("/api/auth/register", (req, res) => {
    const db = loadDb();
    const { name, email, phone, password, address } = req.body;
    if (!name || !email || !phone || !password) {
      res.status(400).json({ message: "Name, email, phone, and password are required." });
      return;
    }
    const exists = db.users.some((u) => u.email.toLowerCase() === String(email).toLowerCase());
    if (exists) {
      res.status(409).json({ message: "An account with this email already exists." });
      return;
    }
    const newUser = {
      id: `usr-${Date.now()}`,
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: String(phone).trim(),
      address: address ? String(address).trim() : "",
      role: "GUEST",
      status: "Active",
      password: String(password),
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.users.push(newUser);
    saveDb(db);
    const token = signToken({ userId: newUser.id, role: newUser.role, email: newUser.email });
    res.status(201).json({ token, user: sanitizeUser(newUser) });
  });
  app.post("/api/auth/login", (req, res) => {
    const db = loadDb();
    const { email, password, expectedRole } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required." });
      return;
    }
    const user = db.users.find(
      (u) => u.email.toLowerCase() === String(email).trim().toLowerCase()
    );
    if (!user || user.password !== String(password)) {
      res.status(401).json({ message: "Invalid email or password." });
      return;
    }
    if (user.status === "Inactive") {
      res.status(403).json({ message: "This account has been deactivated. Contact the resort admin." });
      return;
    }
    if (expectedRole && user.role !== expectedRole) {
      res.status(403).json({
        message: expectedRole === "ADMIN" ? "Access denied. This portal is restricted to Admin accounts." : "Please use the Admin Login portal for administrator accounts."
      });
      return;
    }
    const token = signToken({ userId: user.id, role: user.role, email: user.email });
    res.json({ token, user: sanitizeUser(user) });
  });
  app.get("/api/auth/me", requireAuth, (req, res) => {
    const db = loadDb();
    const user = db.users.find((u) => u.id === req.auth.userId);
    if (!user) {
      res.status(404).json({ message: "Account not found." });
      return;
    }
    res.json({ user: sanitizeUser(user) });
  });
  app.put("/api/auth/profile", requireAuth, (req, res) => {
    const db = loadDb();
    const idx = db.users.findIndex((u) => u.id === req.auth.userId);
    if (idx === -1) {
      res.status(404).json({ message: "User not found." });
      return;
    }
    const { name, phone, address, avatarUrl, currentPassword, newPassword } = req.body;
    const current = db.users[idx];
    if (newPassword) {
      if (!currentPassword || currentPassword !== current.password) {
        res.status(400).json({ message: "Current password is incorrect." });
        return;
      }
      if (String(newPassword).length < 6) {
        res.status(400).json({ message: "New password must be at least 6 characters." });
        return;
      }
      current.password = String(newPassword);
    }
    db.users[idx] = {
      ...current,
      name: name !== void 0 ? String(name).trim() : current.name,
      phone: phone !== void 0 ? String(phone).trim() : current.phone,
      address: address !== void 0 ? String(address).trim() : current.address,
      avatarUrl: avatarUrl !== void 0 ? avatarUrl : current.avatarUrl
    };
    saveDb(db);
    res.json({ user: sanitizeUser(db.users[idx]) });
  });
  app.post("/api/uploads", requireAuth, (req, res) => {
    try {
      const { fileName, dataUrl, folder = "general" } = req.body;
      if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
        res.status(400).json({ message: "Invalid image payload." });
        return;
      }
      const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/i);
      if (!match) {
        res.status(400).json({ message: "Only JPG, JPEG, PNG, and WEBP images are supported." });
        return;
      }
      const ext = match[1].toLowerCase() === "jpeg" ? "jpg" : match[1].toLowerCase();
      const buffer = Buffer.from(match[2], "base64");
      if (buffer.byteLength > 5 * 1024 * 1024) {
        res.status(400).json({ message: "Image exceeds maximum 5 MB limit." });
        return;
      }
      const safeFolder = String(folder).replace(/[^a-zA-Z0-9_-]/g, "");
      const targetDir = path.join(UPLOAD_DIR, safeFolder);
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
      const base = String(fileName || "upload").replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 32);
      const uniqueName = `${base}_${Date.now()}_${crypto.randomBytes(3).toString("hex")}.${ext}`;
      fs.writeFileSync(path.join(targetDir, uniqueName), buffer);
      const url = `/uploads/${safeFolder}/${uniqueName}`;
      res.status(201).json({ url, fileName: uniqueName });
    } catch {
      res.status(500).json({ message: "Failed to store uploaded image." });
    }
  });
  app.get("/api/accommodations", (req, res) => {
    const db = loadDb();
    const { category } = req.query;
    let items = db.accommodations;
    if (category && category !== "All") {
      items = items.filter((a) => a.category === category);
    }
    res.json(items);
  });
  app.get("/api/accommodations/:id", (req, res) => {
    const db = loadDb();
    const item = db.accommodations.find((a) => a.id === req.params.id);
    if (!item) {
      res.status(404).json({ message: "Accommodation not found." });
      return;
    }
    res.json(item);
  });
  app.post("/api/accommodations", requireAdmin, (req, res) => {
    const db = loadDb();
    const body = req.body;
    if (!body.name || !body.category) {
      res.status(400).json({ message: "Name and category are required." });
      return;
    }
    const created = {
      id: `acc-${Date.now()}`,
      name: String(body.name).trim(),
      category: body.category,
      bookingMode: body.bookingMode || (body.category === "Room" ? "overnight" : "both"),
      description: String(body.description || ""),
      capacity: Number(body.capacity) || 4,
      beds: body.beds || "",
      ratePerNight: Number(body.ratePerNight) || 0,
      dayUseRates: body.dayUseRates || {
        Morning: Number(body.ratePerNight) || 0,
        Afternoon: Number(body.ratePerNight) || 0,
        Night: Number(body.ratePerNight) || 0
      },
      amenities: Array.isArray(body.amenities) ? body.amenities : [],
      images: Array.isArray(body.images) ? body.images : [],
      isAvailable: body.isAvailable !== false,
      status: body.status || "Available",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.accommodations.push(created);
    saveDb(db);
    res.status(201).json(created);
  });
  app.put("/api/accommodations/:id", requireAdmin, (req, res) => {
    const db = loadDb();
    const idx = db.accommodations.findIndex((a) => a.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ message: "Accommodation not found." });
      return;
    }
    db.accommodations[idx] = { ...db.accommodations[idx], ...req.body, id: req.params.id };
    saveDb(db);
    res.json(db.accommodations[idx]);
  });
  app.delete("/api/accommodations/:id", requireAdmin, (req, res) => {
    const db = loadDb();
    const idx = db.accommodations.findIndex((a) => a.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ message: "Accommodation not found." });
      return;
    }
    db.accommodations.splice(idx, 1);
    saveDb(db);
    res.json({ success: true });
  });
  app.post("/api/availability/check", (req, res) => {
    const db = loadDb();
    const { accommodationId, stayType, checkInDate, checkOutDate, session, guestCount } = req.body;
    const accommodation = db.accommodations.find((a) => a.id === accommodationId);
    if (!accommodation) {
      res.status(404).json({ available: false, reason: "Accommodation not found." });
      return;
    }
    const result = checkAccommodationAvailability({
      accommodation,
      reservations: db.reservations,
      stayType,
      checkInDate,
      checkOutDate,
      session,
      guestCount: guestCount ? Number(guestCount) : void 0
    });
    res.json(result);
  });
  app.get("/api/facilities", (_req, res) => {
    res.json(loadDb().facilities);
  });
  app.post("/api/facilities", requireAdmin, (req, res) => {
    const db = loadDb();
    const created = {
      id: `fac-${Date.now()}`,
      name: String(req.body.name || ""),
      category: String(req.body.category || "General"),
      description: String(req.body.description || ""),
      operatingHours: String(req.body.operatingHours || "8:00 AM - 9:00 PM"),
      capacity: req.body.capacity ? Number(req.body.capacity) : void 0,
      rateNote: req.body.rateNote || "",
      images: Array.isArray(req.body.images) ? req.body.images : [],
      isAvailable: req.body.isAvailable !== false
    };
    db.facilities.push(created);
    saveDb(db);
    res.status(201).json(created);
  });
  app.put("/api/facilities/:id", requireAdmin, (req, res) => {
    const db = loadDb();
    const idx = db.facilities.findIndex((f) => f.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ message: "Facility not found." });
      return;
    }
    db.facilities[idx] = { ...db.facilities[idx], ...req.body, id: req.params.id };
    saveDb(db);
    res.json(db.facilities[idx]);
  });
  app.delete("/api/facilities/:id", requireAdmin, (req, res) => {
    const db = loadDb();
    db.facilities = db.facilities.filter((f) => f.id !== req.params.id);
    saveDb(db);
    res.json({ success: true });
  });
  app.get("/api/gallery", (_req, res) => {
    res.json(loadDb().gallery);
  });
  app.post("/api/gallery", requireAdmin, (req, res) => {
    const db = loadDb();
    const created = {
      id: `gal-${Date.now()}`,
      title: String(req.body.title || "Resort Photo"),
      category: req.body.category || "Pool & Grounds",
      caption: String(req.body.caption || ""),
      imageUrl: String(req.body.imageUrl || ""),
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.gallery.unshift(created);
    saveDb(db);
    res.status(201).json(created);
  });
  app.delete("/api/gallery/:id", requireAdmin, (req, res) => {
    const db = loadDb();
    db.gallery = db.gallery.filter((g) => g.id !== req.params.id);
    saveDb(db);
    res.json({ success: true });
  });
  app.get("/api/rentals", (_req, res) => {
    res.json(loadDb().rentals);
  });
  app.post("/api/rentals", requireAdmin, (req, res) => {
    const db = loadDb();
    const stock = Number(req.body.stockQuantity) || 1;
    const created = {
      id: `ren-${Date.now()}`,
      name: String(req.body.name || ""),
      category: req.body.category || "Pool Gear",
      description: String(req.body.description || ""),
      price: Number(req.body.price) || 0,
      stockQuantity: stock,
      availableQuantity: req.body.availableQuantity !== void 0 ? Number(req.body.availableQuantity) : stock,
      unitLabel: String(req.body.unitLabel || "per day"),
      isAvailable: req.body.isAvailable !== false
    };
    db.rentals.push(created);
    saveDb(db);
    res.status(201).json(created);
  });
  app.put("/api/rentals/:id", requireAdmin, (req, res) => {
    const db = loadDb();
    const idx = db.rentals.findIndex((r) => r.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ message: "Rental item not found." });
      return;
    }
    db.rentals[idx] = { ...db.rentals[idx], ...req.body, id: req.params.id };
    saveDb(db);
    res.json(db.rentals[idx]);
  });
  app.delete("/api/rentals/:id", requireAdmin, (req, res) => {
    const db = loadDb();
    db.rentals = db.rentals.filter((r) => r.id !== req.params.id);
    saveDb(db);
    res.json({ success: true });
  });
  app.get("/api/reservations", requireAuth, (req, res) => {
    const db = loadDb();
    if (req.auth.role === "ADMIN") {
      res.json(db.reservations);
      return;
    }
    res.json(db.reservations.filter((r) => r.guestId === req.auth.userId));
  });
  app.get("/api/reservations/:id", requireAuth, (req, res) => {
    const db = loadDb();
    const item = db.reservations.find(
      (r) => r.id === req.params.id || r.referenceNumber === req.params.id
    );
    if (!item) {
      res.status(404).json({ message: "Reservation not found." });
      return;
    }
    if (req.auth.role !== "ADMIN" && item.guestId !== req.auth.userId) {
      res.status(403).json({ message: "You are not authorized to view this reservation." });
      return;
    }
    res.json(item);
  });
  app.post("/api/reservations", requireAuth, (req, res) => {
    const db = loadDb();
    const {
      guestId,
      guestName,
      guestEmail,
      guestPhone,
      accommodationId,
      stayType,
      checkInDate,
      checkOutDate,
      session,
      guestCount,
      rentals = [],
      specialRequests
    } = req.body;
    const accommodation = db.accommodations.find((a) => a.id === accommodationId);
    if (!accommodation) {
      res.status(404).json({ message: "Selected accommodation not found." });
      return;
    }
    const effectiveStayType = stayType === "day_use" ? "day_use" : "overnight";
    const effectiveCheckOut = effectiveStayType === "day_use" ? checkInDate : checkOutDate;
    const availability = checkAccommodationAvailability({
      accommodation,
      reservations: db.reservations,
      stayType: effectiveStayType,
      checkInDate,
      checkOutDate: effectiveCheckOut,
      session,
      guestCount: Number(guestCount)
    });
    if (!availability.available) {
      res.status(409).json({ message: availability.reason || "Accommodation is not available." });
      return;
    }
    const verifiedRentals = (Array.isArray(rentals) ? rentals : []).map((reqItem) => {
      const rental = db.rentals.find((r) => r.id === reqItem.rentalId);
      if (!rental || reqItem.quantity <= 0) return null;
      return {
        rentalId: rental.id,
        name: rental.name,
        quantity: Number(reqItem.quantity),
        unitPrice: rental.price,
        subtotal: Math.round(rental.price * Number(reqItem.quantity) * 100) / 100
      };
    }).filter((x) => Boolean(x));
    const pricing = calculateReservationPricing({
      accommodation,
      stayType: effectiveStayType,
      checkInDate,
      checkOutDate: effectiveCheckOut,
      session,
      rentals: verifiedRentals,
      serviceFeeRate: db.settings.serviceFeeRate
    });
    const targetGuestId = req.auth.role === "ADMIN" && guestId ? String(guestId) : req.auth.userId;
    const guestRecord = db.users.find((u) => u.id === targetGuestId);
    const nextNum = 1050 + db.reservations.length + 1;
    const referenceNumber = `RSV-${nextNum}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const created = {
      id: `res-${Date.now()}`,
      referenceNumber,
      guestId: targetGuestId,
      guestName: String(guestName || guestRecord?.name || "Guest"),
      guestEmail: String(guestEmail || guestRecord?.email || req.auth.email),
      guestPhone: String(guestPhone || guestRecord?.phone || ""),
      accommodationId: accommodation.id,
      accommodationName: accommodation.name,
      accommodationCategory: accommodation.category,
      stayType: effectiveStayType,
      checkInDate,
      checkOutDate: effectiveCheckOut,
      session: effectiveStayType === "day_use" ? session || "Morning" : void 0,
      nights: pricing.nights,
      guestCount: Number(guestCount),
      baseAmount: pricing.baseAmount,
      rentals: verifiedRentals,
      rentalsAmount: pricing.rentalsAmount,
      serviceFee: pricing.serviceFee,
      totalAmount: pricing.totalAmount,
      amountPaid: 0,
      balance: pricing.totalAmount,
      specialRequests: specialRequests ? String(specialRequests).trim() : "",
      status: req.auth.role === "ADMIN" && req.body.autoConfirm ? "Confirmed" : "Pending",
      paymentStatus: "Unpaid",
      createdAt: now,
      updatedAt: now
    };
    db.reservations.unshift(created);
    saveDb(db);
    res.status(201).json(created);
  });
  app.patch("/api/reservations/:id/status", requireAuth, (req, res) => {
    const db = loadDb();
    const idx = db.reservations.findIndex((r) => r.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ message: "Reservation not found." });
      return;
    }
    const existing = db.reservations[idx];
    const nextStatus = req.body.status;
    if (req.auth.role !== "ADMIN") {
      if (existing.guestId !== req.auth.userId) {
        res.status(403).json({ message: "Forbidden." });
        return;
      }
      if (nextStatus !== "Cancelled") {
        res.status(403).json({ message: "Guests may only cancel their own reservations." });
        return;
      }
      if (!["Pending", "Confirmed"].includes(existing.status)) {
        res.status(400).json({ message: `Cannot cancel reservation in ${existing.status} state.` });
        return;
      }
    }
    if (["Confirmed", "Checked-In"].includes(nextStatus)) {
      const acc = db.accommodations.find((a) => a.id === existing.accommodationId);
      if (acc) {
        const check = checkAccommodationAvailability({
          accommodation: acc,
          reservations: db.reservations,
          stayType: existing.stayType,
          checkInDate: existing.checkInDate,
          checkOutDate: existing.checkOutDate,
          session: existing.session,
          guestCount: existing.guestCount,
          excludeReservationId: existing.id
        });
        if (!check.available) {
          res.status(409).json({ message: check.reason || "Conflict detected." });
          return;
        }
      }
    }
    db.reservations[idx] = {
      ...existing,
      status: nextStatus,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    saveDb(db);
    res.json(db.reservations[idx]);
  });
  app.put("/api/reservations/:id/rentals", requireAdmin, (req, res) => {
    const db = loadDb();
    const idx = db.reservations.findIndex((r) => r.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ message: "Reservation not found." });
      return;
    }
    const existing = db.reservations[idx];
    const accommodation = db.accommodations.find((a) => a.id === existing.accommodationId);
    if (!accommodation) {
      res.status(404).json({ message: "Accommodation missing." });
      return;
    }
    const reqRentals = Array.isArray(req.body.rentals) ? req.body.rentals : [];
    const verifiedRentals = reqRentals.map((item) => {
      const rental = db.rentals.find((r) => r.id === item.rentalId);
      if (!rental || item.quantity <= 0) return null;
      return {
        rentalId: rental.id,
        name: rental.name,
        quantity: Number(item.quantity),
        unitPrice: rental.price,
        subtotal: Math.round(rental.price * Number(item.quantity) * 100) / 100
      };
    }).filter((x) => Boolean(x));
    const pricing = calculateReservationPricing({
      accommodation,
      stayType: existing.stayType,
      checkInDate: existing.checkInDate,
      checkOutDate: existing.checkOutDate,
      session: existing.session,
      rentals: verifiedRentals,
      serviceFeeRate: db.settings.serviceFeeRate
    });
    db.reservations[idx] = {
      ...existing,
      rentals: verifiedRentals,
      rentalsAmount: pricing.rentalsAmount,
      serviceFee: pricing.serviceFee,
      totalAmount: pricing.totalAmount,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    recalculateReservationPayments(db, existing.id);
    saveDb(db);
    res.json(db.reservations[idx]);
  });
  app.get("/api/payments", requireAuth, (req, res) => {
    const db = loadDb();
    if (req.auth.role === "ADMIN") {
      res.json(db.payments);
      return;
    }
    res.json(db.payments.filter((p) => p.guestId === req.auth.userId));
  });
  app.post("/api/payments", requireAuth, (req, res) => {
    const db = loadDb();
    const {
      reservationId,
      amount,
      paymentType,
      method,
      referenceCode,
      proofImageUrl,
      notes
    } = req.body;
    const reservation = db.reservations.find((r) => r.id === reservationId);
    if (!reservation) {
      res.status(404).json({ message: "Reservation not found." });
      return;
    }
    if (req.auth.role !== "ADMIN" && reservation.guestId !== req.auth.userId) {
      res.status(403).json({ message: "Forbidden." });
      return;
    }
    const numericAmount = Math.round(Number(amount) * 100) / 100;
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      res.status(400).json({ message: "Payment amount must be greater than zero." });
      return;
    }
    if (numericAmount > reservation.balance + 0.01) {
      res.status(400).json({
        message: `Payment amount (${numericAmount}) cannot exceed remaining balance (${reservation.balance}).`
      });
      return;
    }
    const isAdminDirect = req.auth.role === "ADMIN" && req.body.autoApprove === true;
    const adminUser = isAdminDirect ? db.users.find((u) => u.id === req.auth.userId) : void 0;
    if (req.auth.role === "GUEST" && !proofImageUrl) {
      res.status(400).json({ message: "Please upload payment proof before submitting." });
      return;
    }
    const receiptNumber = `RCT-2026-${100 + db.payments.length + 1}`;
    const payment = {
      id: `pay-${Date.now()}`,
      receiptNumber,
      reservationId: reservation.id,
      reservationRef: reservation.referenceNumber,
      guestId: reservation.guestId,
      guestName: reservation.guestName,
      amount: numericAmount,
      paymentType: paymentType || (numericAmount >= reservation.balance ? "Full Payment" : "Down Payment"),
      method: method || "GCash",
      referenceCode: referenceCode ? String(referenceCode).trim() : "",
      proofImageUrl: proofImageUrl || "",
      notes: notes ? String(notes).trim() : "",
      status: isAdminDirect ? "Approved" : "Pending Verification",
      recordedByRole: req.auth.role,
      verifiedBy: isAdminDirect ? adminUser?.name || "Admin" : void 0,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      verifiedAt: isAdminDirect ? (/* @__PURE__ */ new Date()).toISOString() : void 0
    };
    db.payments.unshift(payment);
    recalculateReservationPayments(db, reservation.id);
    saveDb(db);
    res.status(201).json(payment);
  });
  app.patch("/api/payments/:id/verify", requireAdmin, (req, res) => {
    const db = loadDb();
    const idx = db.payments.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ message: "Payment record not found." });
      return;
    }
    const { status, notes } = req.body;
    if (status !== "Approved" && status !== "Rejected") {
      res.status(400).json({ message: "Status must be Approved or Rejected." });
      return;
    }
    const existing = db.payments[idx];
    const reservation = db.reservations.find((r) => r.id === existing.reservationId);
    if (status === "Approved" && reservation) {
      if (existing.amount > reservation.balance + 0.01 && existing.status !== "Approved") {
        res.status(400).json({
          message: "Approving this payment would exceed the remaining reservation balance."
        });
        return;
      }
    }
    const adminUser = db.users.find((u) => u.id === req.auth.userId);
    db.payments[idx] = {
      ...existing,
      status,
      notes: notes !== void 0 ? String(notes) : existing.notes,
      verifiedBy: adminUser?.name || "Admin",
      verifiedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    recalculateReservationPayments(db, existing.reservationId);
    saveDb(db);
    res.json(db.payments[idx]);
  });
  app.get("/api/guest-counts", requireAdmin, (_req, res) => {
    res.json(loadDb().guestCounts);
  });
  app.post("/api/guest-counts", requireAdmin, (req, res) => {
    const db = loadDb();
    const { date, session, kids, adults, seniorPwd, notes } = req.body;
    const k = Math.max(0, Number(kids) || 0);
    const a = Math.max(0, Number(adults) || 0);
    const s = Math.max(0, Number(seniorPwd) || 0);
    const adminUser = db.users.find((u) => u.id === req.auth.userId);
    const record = {
      id: `gc-${Date.now()}`,
      date: String(date),
      session: session || "Morning",
      kids: k,
      adults: a,
      seniorPwd: s,
      total: k + a + s,
      notes: notes ? String(notes).trim() : "",
      recordedBy: adminUser?.name || "Admin",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.guestCounts.unshift(record);
    saveDb(db);
    res.status(201).json(record);
  });
  app.delete("/api/guest-counts/:id", requireAdmin, (req, res) => {
    const db = loadDb();
    db.guestCounts = db.guestCounts.filter((g) => g.id !== req.params.id);
    saveDb(db);
    res.json({ success: true });
  });
  app.get("/api/users", requireAdmin, (req, res) => {
    const db = loadDb();
    const { role } = req.query;
    let users = db.users.map(sanitizeUser);
    if (role === "ADMIN" || role === "GUEST") {
      users = users.filter((u) => u.role === role);
    }
    res.json(users);
  });
  app.post("/api/users", requireAdmin, (req, res) => {
    const db = loadDb();
    const { name, email, phone, password, role, address, status } = req.body;
    if (!name || !email || !phone) {
      res.status(400).json({ message: "Name, email, and phone are required." });
      return;
    }
    const targetRole = role === "ADMIN" ? "ADMIN" : "GUEST";
    const exists = db.users.some((u) => u.email.toLowerCase() === String(email).toLowerCase());
    if (exists) {
      res.status(409).json({ message: "Email already registered." });
      return;
    }
    const created = {
      id: `usr-${Date.now()}`,
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: String(phone).trim(),
      address: address ? String(address).trim() : "",
      role: targetRole,
      status: status === "Inactive" ? "Inactive" : "Active",
      password: String(password || "password123"),
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.users.push(created);
    saveDb(db);
    res.status(201).json(sanitizeUser(created));
  });
  app.put("/api/users/:id", requireAdmin, (req, res) => {
    const db = loadDb();
    const idx = db.users.findIndex((u) => u.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ message: "User not found." });
      return;
    }
    const existing = db.users[idx];
    const nextRole = req.body.role === "ADMIN" ? "ADMIN" : req.body.role === "GUEST" ? "GUEST" : existing.role;
    db.users[idx] = {
      ...existing,
      name: req.body.name !== void 0 ? String(req.body.name).trim() : existing.name,
      email: req.body.email !== void 0 ? String(req.body.email).trim().toLowerCase() : existing.email,
      phone: req.body.phone !== void 0 ? String(req.body.phone).trim() : existing.phone,
      address: req.body.address !== void 0 ? String(req.body.address).trim() : existing.address,
      status: req.body.status === "Inactive" ? "Inactive" : req.body.status === "Active" ? "Active" : existing.status,
      role: nextRole,
      password: req.body.password ? String(req.body.password) : existing.password
    };
    saveDb(db);
    res.json(sanitizeUser(db.users[idx]));
  });
  app.delete("/api/users/:id", requireAdmin, (req, res) => {
    const db = loadDb();
    if (req.params.id === req.auth.userId) {
      res.status(400).json({ message: "You cannot delete your own active admin account." });
      return;
    }
    db.users = db.users.filter((u) => u.id !== req.params.id);
    saveDb(db);
    res.json({ success: true });
  });
  app.get(["/Luckystar-Resort-Reservation-and-Guest-Management-System.zip", "/api/download-zip"], (_req, res) => {
    const zipPath = path.resolve(process.cwd(), "Luckystar-Resort-Reservation-and-Guest-Management-System.zip");
    if (!fs.existsSync(zipPath)) {
      res.status(404).json({ message: "ZIP archive not found." });
      return;
    }
    res.download(zipPath, "Luckystar-Resort-Reservation-and-Guest-Management-System.zip");
  });
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), "dist");
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }
  const PORT = Number(process.env.PORT) || 3e3;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Luckystar Resort System running on http://localhost:${PORT}`);
  });
}
startServer();
