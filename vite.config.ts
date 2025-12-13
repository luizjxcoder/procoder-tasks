import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === "development";

     return {
          // ✅ Define o base dinamicamente (local = "/", deploy = "/procoder-tasks/")
          base: isDev ? "/" : "/procoder-tasks/",

          server: {
               host: "::",
               port: 8080,
          },

          plugins: [
               react(),
          ].filter(Boolean),
     
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },

    build: {
      outDir: "dist",
      sourcemap: false,
      minify: "esbuild",
      target: "esnext",
    },
  };
});
