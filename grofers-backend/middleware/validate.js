import { validationResult } from "express-validator";

export function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Puedes loggear intentos sospechosos aquí
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}
