import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { getRuntimeEnv } from "./config/runtimeEnv";

function Root() {
  const [googleClientId, setGoogleClientId] = useState(null);

  useEffect(() => {
    const clientId = getRuntimeEnv("VITE_GOOGLE_CLIENT_ID", "");

    console.log("Google client ID:", clientId);

    if (clientId) {
      setGoogleClientId(clientId);
    } else {
      console.error("Google Client ID is missing!");
    }
  }, []);

  // IMPORTANT: Don't mount GoogleOAuthProvider until client ID exists
  if (!googleClientId) {
    return <div>Loading...</div>;
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </StrictMode>
);
