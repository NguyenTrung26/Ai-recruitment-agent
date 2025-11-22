import { Router } from "express";
import multer from "multer";
import { handleApplication } from "../controllers/candidate.controller.js";

const router = Router();
const storage = multer.memoryStorage(); // Lưu file vào bộ nhớ để xử lý
const upload = multer({ storage });

router.post("/apply", upload.single("cvFile"), (req, res, next) =>
  handleApplication(req as any, res).catch(next)
);

export default router;
