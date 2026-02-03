import { createRoot } from "react-dom/client";
import App from "./App.tsx";
console.log("--- PROJECT AUDIT ---");
console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
console.log("Project ID:", import.meta.env.VITE_SUPABASE_PROJECT_ID);
console.log("---------------------");

import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
