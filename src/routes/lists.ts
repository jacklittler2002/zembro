import { authMiddleware, AuthedRequest } from "../auth/authMiddleware";
import {
  createLeadList,
  listLeadLists,
  getLeadList,
  addLeadsFromLeadSearch,
  updateLeadList,
  deleteLeadList,
  removeLeadListItems,
} from "../lists/leadListService";
import { exportLeadListToCsv } from "../export/leadListExportService";

export function mountListRoutes(app: any, logger: any) {
  app.get("/api/lists", authMiddleware, async (req: AuthedRequest, res: any) => {
    const lists = await listLeadLists(req.userId!);
    // Map to UI-friendly shape
    const out = lists.map((l: any) => ({
      id: l.id,
      name: l.name,
      description: l.description ?? null,
      color: "#3B82F6",
      leadCount: l._count?.items ?? 0,
      leads: [],
      createdAt: l.createdAt,
    }));
    res.json({ lists: out });
  });

  app.post("/api/lists", authMiddleware, async (req: AuthedRequest, res: any) => {
    const { name, description } = req.body || {};
    const list = await createLeadList(req.userId!, { name, description });
    res.json({ list });
  });

  app.get("/api/lists/:id", authMiddleware, async (req: AuthedRequest, res: any) => {
    const id = req.params.id as string;
    const list = await getLeadList(req.userId!, id);
    if (!list) return res.status(404).json({ error: "Not found" });
    const mapped = {
      id: list.id,
      name: list.name,
      description: list.description ?? null,
      color: "#3B82F6",
      leadCount: list.items.length,
      createdAt: list.createdAt,
      leads: list.items.map((it: any) => ({
        id: it.id,
        companyId: it.companyId,
        contactId: it.contactId ?? null,
        notes: null,
        addedAt: it.createdAt,
        company: it.company
          ? { id: it.company.id, name: it.company.name, domain: it.company.domain, industry: it.company.industry }
          : { id: it.companyId, name: it.companyName, domain: it.websiteUrl, industry: it.industry },
        contact: it.contact
          ? { id: it.contact.id, firstName: it.contact.firstName, lastName: it.contact.lastName, email: it.contact.email, role: it.contact.role }
          : (it.email || it.firstName || it.lastName || it.role
            ? { id: it.contactId, firstName: it.firstName, lastName: it.lastName, email: it.email, role: it.role }
            : null),
      })),
    };
    res.json({ list: mapped });
  });

  app.put("/api/lists/:id", authMiddleware, async (req: AuthedRequest, res: any) => {
    try {
      const { name, description } = req.body || {};
      const id = req.params.id as string;
      const updated = await updateLeadList(req.userId!, id, { name, description });
      res.json({ list: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to update list" });
    }
  });

  app.delete("/api/lists/:id", authMiddleware, async (req: AuthedRequest, res: any) => {
    try {
      const id = req.params.id as string;
      const out = await deleteLeadList(req.userId!, id);
      res.json(out);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to delete list" });
    }
  });

  app.delete("/api/lists/:id/leads", authMiddleware, async (req: AuthedRequest, res: any) => {
    try {
      const id = req.params.id as string;
      const { leadIds } = req.body || {};
      if (!Array.isArray(leadIds) || leadIds.length === 0) return res.json({ removed: 0 });
      const out = await removeLeadListItems(req.userId!, id, leadIds);
      res.json(out);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to remove leads" });
    }
  });

  app.post("/api/lists/:id/add-from-search", authMiddleware, async (req: AuthedRequest, res: any) => {
    const id = req.params.id as string;
    const { leadSearchId, limit, filters } = req.body || {};
    const result = await addLeadsFromLeadSearch(req.userId!, {
      leadListId: id,
      leadSearchId,
      limit,
      filters,
    });
    res.json({ added: result.added, totalCandidates: result.totalCandidates });
  });

  app.get("/api/lists/:id/export", authMiddleware, async (req: AuthedRequest, res: any) => {
    try {
      const id = req.params.id as string;
      const { csv } = await exportLeadListToCsv(req.userId!, id);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="lead-list-${req.params.id}.csv"`);
      return res.send(csv);
    } catch (err: any) {
      if (err?.code === "INSUFFICIENT_CREDITS") {
        return res.status(402).json({
          error: "INSUFFICIENT_CREDITS",
          required: err.required,
          available: err.available,
          contacts: err.contacts,
        });
      }
      if (err?.code === "UPGRADE_REQUIRED") {
        return res.status(403).json({
          error: "UPGRADE_REQUIRED",
          limit: err.limit,
          allowed: err.allowed,
          plan: err.plan,
        });
      }
      logger.error("List export failed", err);
      return res.status(500).json({ error: "Failed to export list" });
    }
  });
}
