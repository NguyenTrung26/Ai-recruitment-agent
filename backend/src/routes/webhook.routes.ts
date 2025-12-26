import { Router } from "express";
import { handleN8nWebhook } from "../controllers/webhook.controller.ts";
import { verifyWebhookSignature } from "../middleware/security.middleware.ts";
import { config } from "../config.ts";

const router = Router();

// Webhook endpoint for n8n to call backend
router.post(
  "/n8n",
  // Uncomment to enable signature verification:
  // verifyWebhookSignature(config.security.webhookSecret || ""),
  handleN8nWebhook
);

export default router;
