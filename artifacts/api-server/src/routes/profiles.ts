import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { profilesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const router: IRouter = Router();

router.post("/profiles/register", async (req, res) => {
  try {
    const { sessionId, firstName, lastName, username, password } = req.body;

    if (!sessionId || !firstName || !lastName || !username || !password) {
      res.status(422).json({ error: "validation_error", message: "All fields are required" });
      return;
    }

    if (username.length < 3) {
      res.status(422).json({ error: "validation_error", message: "Username must be at least 3 characters" });
      return;
    }

    if (password.length < 6) {
      res.status(422).json({ error: "validation_error", message: "Password must be at least 6 characters" });
      return;
    }

    const existing = await db.select().from(profilesTable).where(eq(profilesTable.username, username));
    if (existing.length > 0) {
      res.status(409).json({ error: "conflict", message: "That username is already taken. Please choose another." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [profile] = await db.insert(profilesTable).values({
      sessionId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username: username.trim().toLowerCase(),
      passwordHash,
    }).returning();

    res.status(201).json({
      id: profile.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      username: profile.username,
      createdAt: profile.createdAt,
    });
  } catch (err) {
    console.error("Profile register error:", err);
    res.status(500).json({ error: "internal_error", message: "Failed to create account" });
  }
});

router.get("/profiles/me", async (req, res) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) {
      res.status(422).json({ error: "validation_error", message: "sessionId is required" });
      return;
    }

    const [profile] = await db.select({
      id: profilesTable.id,
      firstName: profilesTable.firstName,
      lastName: profilesTable.lastName,
      username: profilesTable.username,
      createdAt: profilesTable.createdAt,
    }).from(profilesTable).where(eq(profilesTable.sessionId, sessionId as string));

    if (!profile) {
      res.status(404).json({ error: "not_found", message: "No profile found for this session" });
      return;
    }

    res.json(profile);
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ error: "internal_error", message: "Failed to fetch profile" });
  }
});

export default router;
