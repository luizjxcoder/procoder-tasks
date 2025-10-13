import express from "express";
import { createClient } from "@supabase/supabase-js";


const router = express.Router();

// Inicializa o cliente ADMIN do Supabase
const supabaseAdmin = createClient(
     process.env.SUPABASE_URL,
     process.env.SUPABASE_SERVICE_ROLE_KEY // ⚠️ NUNCA no front
);

/**
 * Rota: POST /api/users/create
 * Cria um novo usuário no Supabase via Service Role Key
 */
router.post("/create", async (req, res) => {
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
});

export default router;
