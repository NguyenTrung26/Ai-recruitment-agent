import type { Request, Response } from "express";
import { supabase } from "../services/supabase.service.ts";
import { jobSchema, updateJobSchema } from "../schemas/job.schema.ts";

// Create a new job posting
export const createJob = async (req: Request, res: Response) => {
  try {
    const jobData = jobSchema.parse(req.body);

    const { data: job, error } = await supabase
      .from("jobs")
      .insert(jobData)
      .select()
      .single();

    if (error) throw new Error(`Database error: ${error.message}`);

    res.status(201).json({
      message: "Job created successfully",
      job,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.errors,
      });
    }
    console.error("Create job error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all jobs with filters
export const getJobs = async (req: Request, res: Response) => {
  try {
    const { status, department, employment_type } = req.query;

    let query = supabase.from("jobs").select("*");

    if (status) query = query.eq("status", status);
    if (department) query = query.eq("department", department);
    if (employment_type) query = query.eq("employment_type", employment_type);

    const { data: jobs, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw new Error(`Database error: ${error.message}`);

    res.json({
      count: jobs?.length || 0,
      jobs: jobs || [],
    });
  } catch (error: any) {
    console.error("Get jobs error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get a single job by ID
export const getJobById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: job, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json({ job });
  } catch (error: any) {
    console.error("Get job error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update a job
export const updateJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = updateJobSchema.parse(req.body);

    const { data: job, error } = await supabase
      .from("jobs")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error || !job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json({
      message: "Job updated successfully",
      job,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.errors,
      });
    }
    console.error("Update job error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete a job
export const deleteJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from("jobs").delete().eq("id", id);

    if (error) throw new Error(`Database error: ${error.message}`);

    res.json({ message: "Job deleted successfully" });
  } catch (error: any) {
    console.error("Delete job error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
