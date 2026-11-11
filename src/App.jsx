import React from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { GroupProvider } from "./context/GroupContext";
import { SocketProvider } from "./context/SocketContext";
import { AppRoutes } from "./routes/AppRoutes";
import { Toaster } from "sonner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <GroupProvider>
            <SocketProvider>
              <AppRoutes />
              <Toaster
                position="top-center"
                theme="dark"
                closeButton
                richColors={false}
                toastOptions={{
                  style: {
                    background: "rgba(14, 14, 24, 0.92)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#F8FAFC",
                    borderRadius: "20px",
                    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)",
                    padding: "14px 18px",
                  },
                }}
              />
            </SocketProvider>
          </GroupProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
