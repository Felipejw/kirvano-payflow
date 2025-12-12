import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

// Inicializar tema ANTES de renderizar para evitar flash de tema incorreto
const initializeTheme = () => {
  const savedTheme = localStorage.getItem("theme") || "system";
  
  if (savedTheme === "system") {
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", systemDark);
  } else {
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  }
};

// Escutar mudanças no tema do sistema
const setupSystemThemeListener = () => {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "system" || !savedTheme) {
      document.documentElement.classList.toggle("dark", e.matches);
    }
  });
};

initializeTheme();
setupSystemThemeListener();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
