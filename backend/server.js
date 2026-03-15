import express from "express";
import cors from "cors";
import crypto from "crypto";
import dotenv from "dotenv";
import mongoose from "mongoose";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import { books as seedBooks } from "./books.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bookstore";
const PASSWORD_SALT_ROUNDS = Number(process.env.PASSWORD_SALT_ROUNDS || 10);
const SESSION_TTL_DAYS = Number(process.env.SESSION_TTL_DAYS || 7);
const SESSION_TTL_MS = Math.max(1, SESSION_TTL_DAYS) * 24 * 60 * 60 * 1000;

const allowedOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOriginPattern.test(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json({ limit: "200kb" }));

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const bookSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, index: true },
    title: String,
    category: String,
    price: Number,
    image: String,
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema({
  id: { type: String, unique: true, index: true },
  name: String,
  email: { type: String, unique: true, index: true },
  passwordHash: String,
  createdAt: Date,
});

const sessionSchema = new mongoose.Schema({
  token: { type: String, unique: true, index: true },
  userId: { type: String, index: true },
  createdAt: Date,
  expiresAt: { type: Date, index: { expires: 0 } },
});

const cartSchema = new mongoose.Schema({
  userId: { type: String, unique: true, index: true },
  items: [
    {
      id: String,
      title: String,
      category: String,
      price: Number,
      image: String,
      qty: Number,
    },
  ],
});

const wishlistSchema = new mongoose.Schema({
  userId: { type: String, unique: true, index: true },
  items: [
    {
      id: String,
      title: String,
      category: String,
      price: Number,
      image: String,
    },
  ],
});

const orderSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  items: [
    {
      id: String,
      title: String,
      category: String,
      price: Number,
      image: String,
      qty: Number,
    },
  ],
  total: Number,
  status: String,
  createdAt: Date,
});

const Book = mongoose.model("Book", bookSchema);
const User = mongoose.model("User", userSchema);
const Session = mongoose.model("Session", sessionSchema);
const Cart = mongoose.model("Cart", cartSchema);
const Wishlist = mongoose.model("Wishlist", wishlistSchema);
const Order = mongoose.model("Order", orderSchema);

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function legacySha256(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function sanitizeBook(input) {
  const book = input || {};
  const price = Number(book.price);
  if (!book.id || !book.title || !Number.isFinite(price) || price <= 0) return null;
  return {
    id: String(book.id),
    title: String(book.title),
    category: String(book.category || ""),
    price,
    image: String(book.image || ""),
  };
}

async function requireAuth(req, res) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  const session = await Session.findOne({ token }).lean();
  if (!session) {
    res.status(401).json({ error: "Invalid session" });
    return null;
  }
  if (session.expiresAt && new Date(session.expiresAt).getTime() <= Date.now()) {
    await Session.deleteMany({ token });
    res.status(401).json({ error: "Session expired" });
    return null;
  }
  const user = await User.findOne({ id: session.userId }).lean();
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return null;
  }
  return { user, token };
}

async function ensureBooksSeed() {
  const count = await Book.countDocuments();
  if (count > 0) return;
  await Book.insertMany(seedBooks);
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/books", async (req, res) => {
  try {
    const category = String(req.query.category || "").trim().toLowerCase();
    const filter = !category || category === "all" ? {} : { category: new RegExp(`^${category}$`, "i") };
    const items = await Book.find(filter).lean();
    return res.json({ items });
  } catch (err) {
    return res.status(500).json({ error: "Failed to load books" });
  }
});

app.post("/api/auth/register", authLimiter, async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!name || !email || !emailPattern.test(email) || password.length < 6) {
      return res.status(400).json({ error: "Name, valid email, and password(min 6) required" });
    }

    const exists = await User.findOne({ email }).lean();
    if (exists) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const user = {
      id: crypto.randomUUID(),
      name,
      email,
      passwordHash: await bcrypt.hash(password, PASSWORD_SALT_ROUNDS),
      createdAt: new Date(),
    };

    await User.create(user);
    await Cart.create({ userId: user.id, items: [] });
    await Wishlist.create({ userId: user.id, items: [] });

    return res.status(201).json({ message: "Registered" });
  } catch (err) {
    return res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/auth/login", authLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    let matches = false;
    if ((user.passwordHash || "").startsWith("$2")) {
      matches = await bcrypt.compare(password, user.passwordHash || "");
    } else {
      matches = user.passwordHash === legacySha256(password);
      if (matches) {
        user.passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
        await user.save();
      }
    }
    if (!matches) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    await Session.deleteMany({ userId: user.id });
    const token = crypto.randomUUID();
    await Session.create({
      token,
      userId: user.id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    });

    return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    return res.status(500).json({ error: "Login failed" });
  }
});

app.post("/api/auth/logout", async (req, res) => {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  await Session.deleteMany({ token: auth.token });
  return res.json({ message: "Logged out" });
});

app.get("/api/auth/me", async (req, res) => {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  return res.json({ user: { id: auth.user.id, name: auth.user.name, email: auth.user.email } });
});

app.get("/api/cart", async (req, res) => {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const cart = await Cart.findOne({ userId: auth.user.id }).lean();
  res.json({ items: cart?.items || [] });
});

app.post("/api/cart", async (req, res) => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const book = sanitizeBook(req.body.book);
  if (!book) {
    return res.status(400).json({ error: "Invalid book" });
  }

  const cart = await Cart.findOne({ userId: auth.user.id });
  if (!cart) {
    const created = await Cart.create({ userId: auth.user.id, items: [{ ...book, qty: 1 }] });
    return res.json({ items: created.items });
  }

  const existing = cart.items.find((item) => item.id === book.id);
  if (existing) existing.qty += 1;
  else cart.items.push({ ...book, qty: 1 });

  await cart.save();
  res.json({ items: cart.items });
});

app.patch("/api/cart/:id", async (req, res) => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const action = req.body.action;
  if (action !== "inc" && action !== "dec") {
    return res.status(400).json({ error: "Invalid action" });
  }
  const cart = await Cart.findOne({ userId: auth.user.id });
  if (!cart) return res.status(404).json({ error: "Cart not found" });

  const item = cart.items.find((entry) => entry.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: "Item not found" });
  }

  if (action === "inc") item.qty += 1;
  if (action === "dec") item.qty -= 1;

  cart.items = cart.items.filter((entry) => entry.qty > 0);
  await cart.save();
  res.json({ items: cart.items });
});

app.delete("/api/cart/:id", async (req, res) => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const cart = await Cart.findOne({ userId: auth.user.id });
  if (!cart) return res.json({ items: [] });

  cart.items = cart.items.filter((item) => item.id !== req.params.id);
  await cart.save();
  res.json({ items: cart.items });
});

app.delete("/api/cart", async (req, res) => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const cart = await Cart.findOne({ userId: auth.user.id });
  if (!cart) return res.json({ items: [] });

  cart.items = [];
  await cart.save();
  res.json({ items: [] });
});

app.get("/api/wishlist", async (req, res) => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const wishlist = await Wishlist.findOne({ userId: auth.user.id }).lean();
  res.json({ items: wishlist?.items || [] });
});

app.post("/api/wishlist", async (req, res) => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const book = sanitizeBook(req.body.book);
  if (!book) {
    return res.status(400).json({ error: "Invalid book" });
  }

  const wishlist = await Wishlist.findOne({ userId: auth.user.id });
  if (!wishlist) {
    const created = await Wishlist.create({ userId: auth.user.id, items: [book] });
    return res.json({ items: created.items });
  }

  if (!wishlist.items.some((item) => item.id === book.id)) {
    wishlist.items.push(book);
  }

  await wishlist.save();
  res.json({ items: wishlist.items });
});

app.delete("/api/wishlist/:id", async (req, res) => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const wishlist = await Wishlist.findOne({ userId: auth.user.id });
  if (!wishlist) return res.json({ items: [] });

  wishlist.items = wishlist.items.filter((item) => item.id !== req.params.id);
  await wishlist.save();
  res.json({ items: wishlist.items });
});

app.post("/api/wishlist/:id/move-to-cart", async (req, res) => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const wishlist = await Wishlist.findOne({ userId: auth.user.id });
  const cart = await Cart.findOne({ userId: auth.user.id });
  if (!wishlist) return res.status(404).json({ error: "Wishlist not found" });

  const item = wishlist.items.find((entry) => entry.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: "Item not found" });
  }

  wishlist.items = wishlist.items.filter((entry) => entry.id !== item.id);

  if (!cart) {
    await Wishlist.updateOne({ userId: auth.user.id }, { items: wishlist.items });
    const created = await Cart.create({ userId: auth.user.id, items: [{ ...item, qty: 1 }] });
    return res.json({ cart: created.items, wishlist: wishlist.items });
  }

  const cartItem = cart.items.find((entry) => entry.id === item.id);
  if (cartItem) cartItem.qty += 1;
  else cart.items.push({ ...item, qty: 1 });

  await wishlist.save();
  await cart.save();
  res.json({ cart: cart.items, wishlist: wishlist.items });
});

app.post("/api/orders", async (req, res) => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const cart = await Cart.findOne({ userId: auth.user.id });
  const items = (cart?.items || []).filter((item) => item.qty > 0);
  if (!items.length) {
    return res.status(400).json({ error: "Cart is empty" });
  }

  const total = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0);
  const order = await Order.create({
    userId: auth.user.id,
    items,
    total,
    status: "placed",
    createdAt: new Date(),
  });

  cart.items = [];
  await cart.save();

  res.status(201).json({ order });
});

app.get("/api/orders", async (req, res) => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const orders = await Order.find({ userId: auth.user.id }).sort({ createdAt: -1 }).lean();
  res.json({ items: orders || [] });
});

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    await ensureBooksSeed();
    app.listen(PORT, () => {
      console.log(`Backend running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Backend failed to start:", err.message);
    process.exit(1);
  }
}

start();
