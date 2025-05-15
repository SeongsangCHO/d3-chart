import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { RDKitModule } from "@rdkit/rdkit";

declare global {
  interface Window {
    RDKit: RDKitModule;
    initRDKitModule: () => Promise<RDKitModule>;
  }
}

const loadRDKit = () => {
  return new Promise<RDKitModule>((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://unpkg.com/@rdkit/rdkit@2023.3.1-1.0.1/dist/RDKit_minimal.js";
    script.onload = async () => {
      console.log("RDKit loaded");
      try {
        // RDKit 인스턴스 초기화
        const rdkit = await window.initRDKitModule();
        window.RDKit = rdkit;
        console.log("RDKit initialized");
        resolve(rdkit);
      } catch (error) {
        reject(error);
      }
    };
    script.onerror = (e) => {
      console.error("RDKit script failed to load.", e);
      reject(e);
    };
    document.head.appendChild(script);
  });
};

// RDKit 로드 후 앱 렌더링
loadRDKit()
  .then((rdkit) => {
    createRoot(document.getElementById("root")!).render(
      <StrictMode>
        <App rdkit={rdkit} />
      </StrictMode>
    );
  })
  .catch((error) => {
    console.error("Failed to initialize RDKit:", error);
  });
