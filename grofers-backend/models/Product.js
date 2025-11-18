import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    image: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 100, min: 0 },
  },
  { timestamps: true }
);

// 🔹 Transforma _id → id
productSchema.method("toJSON", function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

// 🔹 Método auxiliar para descontar stock de manera segura
productSchema.methods.reduceStock = async function (quantity) {
  if (this.stock < quantity) {
    throw new Error(`Stock insuficiente para ${this.title}`);
  }
  this.stock -= quantity;
  await this.save();
};

export default mongoose.model("Product", productSchema);
