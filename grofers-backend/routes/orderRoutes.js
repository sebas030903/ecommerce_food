import express from "express";
import { body } from "express-validator";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { handleValidation } from "../middleware/validate.js";

const router = express.Router();

/**
 * GET /api/orders
 * - admin → ve todos
 * - user → ve solo sus pedidos
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";
    const query = isAdmin ? {} : { user: req.user.email };

    const projection = {
      user: 1,
      total: 1,
      date: 1,
      shipping: 1,
      cart: 1,
    };

    const orders = await Order.find(query, projection)
      .sort({ date: -1 })
      .lean();

    res.json(orders);
  } catch (err) {
    console.error("❌ Error en GET /orders:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

/**
 * GET /api/orders/my-orders
 * - Solo el usuario ve sus pedidos
 */
router.get("/my-orders", requireAuth, async (req, res) => {
  try {
    const email = req.user.email;

    const orders = await Order.find({ user: email })
      .sort({ date: -1 })
      .lean();

    res.json(orders);
  } catch (err) {
    console.error("❌ Error en my-orders:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

/**
 * POST /api/orders
 */
router.post(
  "/",
  requireAuth,
  [
    body("cart").isArray({ min: 1 }),
    body("total").isFloat({ gt: 0 }),
    body("shipping.address").notEmpty(),
    body("shipping.city").notEmpty(),
    body("shipping.postal").notEmpty(),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { cart, total, shipping } = req.body;

      const order = new Order({
        user: req.user.email,
        cart,
        total,
        shipping,
      });

      await order.save();

      res.json({ message: "Pedido guardado exitosamente" });
    } catch (err) {
      console.error("❌ Error al guardar pedido:", err);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
);

/**
 * DELETE /api/orders/:id
 * - Solo admin
 */
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const deleted = await Order.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    res.json({ message: "Pedido eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error al borrar pedido:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
