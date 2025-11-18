import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  user: { type: String, required: true },
  cart: { type: Array, required: true },
  total: { type: Number, required: true },
  shipping: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    postal: { type: String, required: true },
  },
  date: { type: Date, default: Date.now },
});

export default mongoose.model("Order", orderSchema);
