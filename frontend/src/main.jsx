import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ConfirmProvider } from "./context/ConfirmContext.jsx";
import { SuccessProvider } from "./context/SuccessContext.jsx";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ConfirmProvider>
            <SuccessProvider>
              <App />
              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    borderRadius: "12px",
                    background: "#fff",
                    color: "#0B1F4F",
                    boxShadow: "0 6px 24px -8px rgba(11,31,79,0.18)",
                    border: "1px solid #E2E8F0",
                  },
                }}
              />
            </SuccessProvider>
          </ConfirmProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
