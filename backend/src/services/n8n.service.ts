import axios from "axios";
import { config } from "../config.ts";

export const triggerN8nWorkflow = async (payload: any) => {
  if (!config.n8n.webhookUrl) {
    console.warn("N8N_WEBHOOK_URL not set. Skipping webhook trigger.");
    return;
  }
  try {
    await axios.post(config.n8n.webhookUrl, payload);
    console.log(
      `Successfully triggered n8n workflow for candidate ${payload.candidate?.email}`
    );
  } catch (error: any) {
    console.error("Failed to trigger n8n webhook:", error.message);
  }
};
