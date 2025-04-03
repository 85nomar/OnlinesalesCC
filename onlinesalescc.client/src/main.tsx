import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./components/ui/calendar.css";

// Import i18n (import before rendering)
import "./lib/i18n";

// Create a root
const container = document.getElementById("root");
if (!container) throw new Error("Root element not found");
const root = createRoot(container);

// Render app into it
root.render(<App />);
