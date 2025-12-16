import { Router } from "express";
import { prisma } from "../db";
import { maybeMarkLeadSearchDone } from "../leadSearch/leadSearchProgressService";

const router = Router();

// GET /api/lead-searches/:id/progress
router.get("/lead-searches/:id/progress", async (req, res) => {
  const { id } = req.params;
  const leadSearch = await prisma.leadSearch.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      discoveredCount: true,
      crawledCount: true,
      enrichedCount: true,
      contactsFoundCount: true,
      maxLeads: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!leadSearch) return res.status(404).json({ error: "Not found" });

  // Optionally, re-check completion
  await maybeMarkLeadSearchDone(id);

  res.json({
    ...leadSearch,
    isComplete: leadSearch.status === "DONE",
  });
});

export default router;
