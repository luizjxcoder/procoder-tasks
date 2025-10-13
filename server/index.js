import 'dotenv/config'; // ✅ carrega automaticamente o .env
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import usersRoutes from "./routes/users.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Rotas
app.use("/api/users", usersRoutes);

// Porta do servidor backend
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
     console.log(`✅ Backend rodando em http://localhost:${PORT}`);
});
