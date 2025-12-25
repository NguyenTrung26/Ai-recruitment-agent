import { Router, type Request, type Response } from "express";
import { supabase } from "../services/supabase.service.ts";
import { logger } from "../services/logger.service.ts";

const router = Router();

/**
 * POST /api/schedules
 * Add a new schedule for posting job
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { job_title, job_desc, apply_link, scheduled_time } = req.body;

    if (!job_title || !job_desc || !apply_link || !scheduled_time) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { data, error } = await supabase
      .from("scheduled_jobs")
      .insert([
        {
          job_title,
          job_desc,
          apply_link,
          scheduled_time,
          status: "todo",
          posted_time: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      logger.error({ error }, "Failed to insert schedule");
      return res.status(500).json({ error: "Failed to add schedule" });
    }

    logger.info({ job_title, scheduled_time }, "Schedule added");
    return res.json({
      success: true,
      message: "Schedule added successfully",
      data,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage }, "Schedule POST error");
    return res.status(500).json({
      error: "Internal server error",
      details: errorMessage,
    });
  }
});

/**
 * GET /api/schedules
 * Get all schedules
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("scheduled_jobs")
      .select(
        "id, job_title, job_desc, scheduled_time, status, apply_link, posted_time"
      )
      .order("posted_time", { ascending: false });

    if (error) {
      logger.error({ error }, "Failed to fetch schedules");
      return res.status(500).json({ error: "Failed to fetch schedules" });
    }

    const mapped = data.map((item: any) => ({
      id: item.id,
      title: item.job_title,
      content: item.job_desc,
      scheduled_time: item.scheduled_time,
      status: item.status,
      apply_link: item.apply_link,
      created_at: item.posted_time,
    }));

    logger.info({ count: mapped.length }, "Schedules fetched");
    return res.json(mapped);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage }, "Schedule GET error");
    return res.status(500).json({
      error: "Internal server error",
      details: errorMessage,
    });
  }
});

/**
 * PUT /api/schedules/:id
 * Update schedule status
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const { data, error } = await supabase
      .from("scheduled_jobs")
      .update({ status })
      .eq("id", id)
      .select();

    if (error) {
      logger.error({ error, id }, "Failed to update schedule");
      return res.status(500).json({ error: "Failed to update schedule" });
    }

    logger.info({ id, status }, "Schedule updated");
    return res.json({
      success: true,
      message: "Status updated successfully",
      data,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage }, "Schedule PUT error");
    return res.status(500).json({
      error: "Internal server error",
      details: errorMessage,
    });
  }
});

/**
 * DELETE /api/schedules/:id
 * Delete a schedule
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("scheduled_jobs")
      .delete()
      .eq("id", id);

    if (error) {
      logger.error({ error, id }, "Failed to delete schedule");
      return res.status(500).json({ error: "Failed to delete schedule" });
    }

    logger.info({ id }, "Schedule deleted");
    return res.json({
      success: true,
      message: "Schedule deleted successfully",
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage }, "Schedule DELETE error");
    return res.status(500).json({
      error: "Internal server error",
      details: errorMessage,
    });
  }
});

export default router;
