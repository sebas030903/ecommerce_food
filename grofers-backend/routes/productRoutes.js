import express from "express";
import Product from "../models/Product.js";
import {
  requireAuth,
  requireRole,
  requireAdminOrAssistant,
} from "../middleware/auth.js";

const router = express.Router();

/* ============================
   GET /api/products
============================ */
router.get("/", async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};

    const products = await Product.find(filter).sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    console.error("❌ Error GET /products:", err);
    res.status(500).json({ error: "Error cargando productos" });
  }
});

/* ============================
   GET /api/products/categories
============================ */
router.get("/categories", async (_req, res) => {
  try {
    const categories = await Product.distinct("category");
    res.json(categories);
  } catch (err) {
    console.error("❌ Error GET /categories:", err);
    res.status(500).json({ error: "Error cargando categorías" });
  }
});

/* ============================
   POST /api/products (ADMIN o ASSISTANT)
============================ */
router.post("/", requireAuth, requireAdminOrAssistant, async (req, res) => {
  try {
    const { title, description, image, category, price, stock } = req.body;

    if (!title || !image || !category || price == null) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    const newProduct = await Product.create({
      title,
      description,
      image,
      category,
      price,
      stock: stock ?? 100,
    });

    res.status(201).json(newProduct);
  } catch (err) {
    console.error("❌ Error creando producto:", err);
    res.status(500).json({ error: "Error al crear producto" });
  }
});

/* ============================
   GET /api/products/:id
============================ */
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(product);
  } catch (err) {
    console.error("❌ Error GET /product/:id:", err);
    res.status(500).json({ error: "Error cargando producto" });
  }
});

/* ============================
   PUT /api/products/:id (ADMIN o ASSISTANT)
============================ */
router.put("/:id", requireAuth, requireAdminOrAssistant, async (req, res) => {
  try {
    const allowed = [
      "title",
      "description",
      "image",
      "category",
      "price",
      "stock",
    ];
    const updates = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(updated);
  } catch (err) {
    console.error("❌ Error UPDATE /product:", err);
    res.status(500).json({ error: "Error actualizando producto" });
  }
});

/* ============================
   DELETE /api/products/:id (ADMIN o ASSISTANT)
============================ */
router.delete(
  "/:id",
  requireAuth,
  requireAdminOrAssistant,
  async (req, res) => {
    try {
      const deleted = await Product.findByIdAndDelete(req.params.id);

      if (!deleted) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      res.json({ message: "Producto eliminado correctamente" });
    } catch (err) {
      console.error("❌ Error DELETE /product:", err);
      res.status(500).json({ error: "Error eliminando producto" });
    }
  }
);

/* ============================
   POST /api/products/reduce-stock
============================ */
router.post("/reduce-stock", requireAuth, async (req, res) => {
  try {
    const { cart } = req.body;

    if (!cart || !Array.isArray(cart)) {
      return res.status(400).json({ error: "Carrito inválido" });
    }

    for (const item of cart) {
      const p = await Product.findById(item.id);
      if (!p)
        return res
          .status(404)
          .json({ error: `Producto no encontrado: ${item.title}` });

      if (p.stock < item.quantity) {
        return res
          .status(400)
          .json({ error: `Stock insuficiente para ${p.title}` });
      }

      p.stock -= item.quantity;
      await p.save();
    }

    res.json({ message: "Stock actualizado correctamente" });
  } catch (err) {
    console.error("❌ Error REDUCE-STOCK:", err);
    res.status(500).json({ error: "Error actualizando stock" });
  }
});

export default router;
