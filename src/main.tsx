import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import App from "./App.tsx"
import "./index.css"

// Detecta se está em produção (GitHub Pages) e aplica o basename dinamicamente
const isProd = window.location.hostname.includes("github.io")
const baseName = isProd ? "/procoder-tasks" : "/"

createRoot(document.getElementById("root")!).render(
     <BrowserRouter basename={baseName}>
          <App />
     </BrowserRouter>
)

