import type { Request, Response } from "express";
import { supabase } from "../services/supabase.service.ts";

// Get dashboard statistics
export const getStatistics = async (req: Request, res: Response) => {
  try {
    // Total candidates
    const { count: totalCandidates } = await supabase
      .from("candidates")
      .select("*", { count: "exact", head: true });

    // Candidates by status
    const { data: statusBreakdown } = await supabase
      .from("candidates")
      .select("status")
      .then(({ data }) => {
        const breakdown: Record<string, number> = {};
        data?.forEach((item) => {
          breakdown[item.status] = (breakdown[item.status] || 0) + 1;
        });
        return { data: breakdown };
      });

    // Average AI score
    const { data: scoresData } = await supabase
      .from("candidates")
      .select("ai_score")
      .not("ai_score", "is", null);

    const avgScore =
      scoresData && scoresData.length > 0
        ? scoresData.reduce((sum, item) => sum + (item.ai_score || 0), 0) /
          scoresData.length
        : 0;

    // Pass rate (screening-passed / total screened)
    const { count: screeningPassed } = await supabase
      .from("candidates")
      .select("*", { count: "exact", head: true })
      .eq("status", "screening-passed");

    const { count: totalScreened } = await supabase
      .from("candidates")
      .select("*", { count: "exact", head: true })
      .not("ai_score", "is", null);

    const passRate =
      totalScreened && totalScreened > 0
        ? ((screeningPassed || 0) / totalScreened) * 100
        : 0;

    // Total jobs
    const { count: totalJobs } = await supabase
      .from("jobs")
      .select("*", { count: "exact", head: true });

    // Open jobs
    const { count: openJobs } = await supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", "open");

    // Recent applications (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recentApplications } = await supabase
      .from("candidates")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo.toISOString());

    res.json({
      statistics: {
        totalCandidates: totalCandidates || 0,
        totalJobs: totalJobs || 0,
        openJobs: openJobs || 0,
        statusBreakdown: statusBreakdown || {},
        averageAiScore: Math.round(avgScore * 100) / 100,
        passRate: Math.round(passRate * 100) / 100,
        recentApplications: recentApplications || 0,
      },
    });
  } catch (error: any) {
    console.error("Get statistics error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get candidates by job ID with statistics
export const getCandidatesByJob = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const { data: candidates, error } = await supabase
      .from("candidates")
      .select("*")
      .eq("job_id", jobId)
      .order("ai_score", { ascending: false, nullsFirst: false });

    if (error) throw new Error(`Database error: ${error.message}`);

    // Calculate statistics for this job
    const total = candidates?.length || 0;
    const screened = candidates?.filter((c) => c.ai_score !== null).length || 0;
    const passed =
      candidates?.filter((c) => c.status === "screening-passed").length || 0;
    const avgScore =
      screened > 0
        ? candidates
            ?.filter((c) => c.ai_score !== null)
            .reduce((sum, c) => sum + (c.ai_score || 0), 0) / screened
        : 0;

    res.json({
      jobId,
      statistics: {
        totalCandidates: total,
        screenedCandidates: screened,
        passedCandidates: passed,
        averageScore: Math.round(avgScore * 100) / 100,
        passRate: screened > 0 ? Math.round((passed / screened) * 100) : 0,
      },
      candidates: candidates || [],
    });
  } catch (error: any) {
    console.error("Get candidates by job error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
