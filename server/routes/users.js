import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

function getSupabaseAdmin() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase env vars não configuradas");
  }

  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

router.post("/create", async (req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: role || "user" },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ user: data.user });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
