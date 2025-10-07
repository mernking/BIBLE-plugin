"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import io from "socket.io-client";
import { toast } from "react-toastify";

let socket;

export default function HomePage() {
  const [apiKey, setApiKey] = useState(null);
  const [overlayUrl, setOverlayUrl] = useState("");
  const router = useRouter();

  const navigateToControl = useCallback(() => {
    if (apiKey) {
      router.push(`/control?key=${apiKey}`);
    }
  }, [apiKey, router]);

  useEffect(() => {
    console.log("useEffect: Starting HomePage setup...");
    let currentApiKey;

    const setup = async () => {
      try {
        const res = await fetch("/api/generate-api-key");
        const data = await res.json();
        currentApiKey = data.apiKey;
        setApiKey(currentApiKey);
        console.log("API Key fetched:", currentApiKey);

        const generatedOverlayUrl =
          typeof window !== "undefined"
            ? `${window.location.origin}/overlay?key=${currentApiKey}`
            : `http://localhost:3000/overlay?key=${currentApiKey}`;
        setOverlayUrl(generatedOverlayUrl);
        console.log("Generated Overlay URL:", generatedOverlayUrl);

        const serverUrl =
          process.env.NEXT_PUBLIC_SERVER_URL || window.location.origin;
        socket = io(serverUrl, {
          query: { apiKey: currentApiKey, type: "home" },
          transports: ["websocket"],
        });
        console.log("Socket initialized:", socket);

        console.log("Attaching socket event listeners...");
        socket.on("connect", () => {
          console.log("Home page connected to socket.io server");
          console.log("Socket ID:", socket.id);
        });
        socket.on("disconnect", () =>
          console.log("Home page disconnected from socket.io server")
        );

        socket.on("overlayConnected", () => {
          console.log("overlayConnected event received on home page. Redirecting...");
          toast.success("Overlay Connected! Redirecting to control panel.");
          navigateToControl();
        });

        socket.on("connect_error", (error) => {
          console.error("Home page socket connection error:", error.message);
          toast.error(`Socket connection error: ${error.message}`);
        });
        console.log("Socket event listeners attached.");
      } catch (error) {
        console.error("Failed to generate API key or connect socket:", error);
        toast.error("Failed to initialize: " + error.message);
      }
    };

    setup();

    return () => {
      console.log("useEffect cleanup: Disconnecting socket if it exists.");
      if (socket) {
        socket.disconnect();
      }
    };
  }, [router]);

  const copyToClipboard = async (textToCopy) => {
    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        toast.success("Overlay URL copied to clipboard!");
        return;
      } catch (err) {
        console.error("Clipboard API failed:", err);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text p-4">
      <h1 className="text-4xl font-bold mb-6 text-primary">OBS Bible Plugin</h1>

      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full">
        <h2 className="text-2xl font-semibold mb-4 text-accent">Welcome!</h2>

        <p className="mb-4 text-gray-700">
          Use this plugin to display Bible verses on your OBS streams.
        </p>

        <div className="mb-6">
          <label
            htmlFor="overlay-url"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            OBS Browser Source URL:
          </label>
          <div className="flex items-center border border-gray-300 rounded-md shadow-sm overflow-hidden">
            <input
              type="text"
              id="overlay-url"
              readOnly
              value={overlayUrl}
              className="flex-grow p-2 text-sm bg-gray-50 text-gray-800 focus:outline-none"
            />
            <button
              onClick={() => copyToClipboard(overlayUrl)} // ✅ pass overlayUrl
              className="bg-primary text-white px-4 py-2 text-sm hover:opacity-80 transition-opacity duration-200"
            >
              Copy
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-600 mt-4">
          Copy the URL above and paste it into OBS as a Browser Source. Once the
          overlay connects, you will be redirected to the control panel.
        </p>

        <button
          onClick={navigateToControl}
          className="mt-4 bg-secondary text-white px-4 py-2 rounded-md hover:opacity-80"
          disabled={!apiKey}
        >
          Go to Control Panel (Manual)
        </button>
      </div>
    </div>
  );
}
