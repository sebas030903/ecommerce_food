import mongoose from "mongoose";
import "dotenv/config";
import Product from "./models/Product.js";

// 📌 Categorías disponibles
const categories = [
  "Frutas",
  "Verduras",
  "Carnes",
  "Pescados",
  "Proteínas",
  "Lácteos",
  "Bebidas",
  "Panadería",
  "Limpieza",
  "Higiene",
  "Snacks",
  "Desayuno",
];

// 📌 Variaciones típicas para productos (1L, 500ml, etc.)
const sizes = [
  "250g", "500g", "1kg", "2kg",
  "250ml", "500ml", "1L", "1.5L", "2L", "3L",
  "Unidad", "Pack x6", "Pack x12", "Caja x24",
];

// 📌 Productos base por categorías
const baseNames = {
  Frutas: ["Manzana", "Plátano", "Naranja", "Mandarina", "Uva", "Mango", "Fresa", "Kiwi", "Melón"],
  Verduras: ["Tomate", "Lechuga", "Zanahoria", "Cebolla", "Pimiento", "Ajo", "Brócoli", "Coliflor"],
  Carnes: ["Pechuga de Pollo", "Carne Molida", "Chuleta de Cerdo", "Carne de Res", "Pollo Entero"],
  Pescados: ["Atún", "Salmón", "Tilapia", "Trucha"],
  Proteínas: ["Huevos", "Tofu", "Jamón", "Pavo"],
  Lácteos: ["Leche", "Queso Fresco", "Yogurt", "Mantequilla"],
  Bebidas: [
    "Coca Cola", "Pepsi", "Inca Kola", "Agua San Luis", "Red Bull",
    "Jugo de Naranja", "Cerveza Cusqueña"
  ],
  Panadería: ["Pan Francés", "Pan de Molde", "Croissant", "Kekito", "Empanada"],
  Limpieza: ["Detergente Ariel", "Lavavajillas Sapolio", "Limpiador Multiusos", "Cloro"],
  Higiene: ["Shampoo Sedal", "Jabón Dove", "Pasta Dental Colgate", "Desodorante Rexona"],
  Snacks: ["Oreo", "Cheetos", "Papas Lays", "Sublime", "Casino", "Chocman"],
  Desayuno: ["Avena Quaker", "Cereal Zucaritas", "Café Altomayo", "Té Verde"],
};

// 📌 Generador de productos aleatorios
function generateRandomProduct(i) {
  const category = categories[Math.floor(Math.random() * categories.length)];
  const baseList = baseNames[category];
  const name = baseList[Math.floor(Math.random() * baseList.length)];

  const size = sizes[Math.floor(Math.random() * sizes.length)];

  return {
    title: `${name} ${size}`,
    description: `Producto ${name} (${size}) en la categoría ${category}.`,
    image: `https://picsum.photos/seed/${i}/500/300`, // imagen válida SIEMPRE
    category,
    price: Number((Math.random() * 20 + 1).toFixed(2)), // $1 - $20
    stock: Math.floor(Math.random() * 150) + 10, // 10 - 160
  };
}

// 📌 Generar 1000 productos
const products = Array.from({ length: 1000 }, (_, i) => generateRandomProduct(i + 1));

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB conectado, limpiando colección...");
    await Product.deleteMany({});

    console.log("🛒 Insertando 1000 productos generados...");
    await Product.insertMany(products);

    console.log("🎉 ¡1000 productos generados e insertados correctamente!");
    mongoose.connection.close();
  })
  .catch((err) => console.error("❌ Error:", err));
