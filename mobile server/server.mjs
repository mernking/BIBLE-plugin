import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
// Bind to your Wi-Fi IP so other devices can connect
const hostname = 'localhost';

const port = 3000;

const app = next({ dev, hostname, port });

const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*", // allow any device
      methods: ["GET", "POST"],
    },
  });

  const activeApiKeys = new Map(); // Map<apiKey, { homeSocket: Socket | null, mobileSocket: Socket | null, overlaySockets: Set<Socket> }>

  io.use((socket, next) => {
    const apiKey = socket.handshake.query.apiKey;
    if (!apiKey) {
      return next(new Error("Authentication error: API Key missing"));
    }
    if (typeof apiKey === "string" && apiKey.length > 0) {
      socket.apiKey = apiKey; // Attach apiKey to the socket for later use
      socket.clientType = socket.handshake.query.type || "overlay"; // Default to overlay if type not provided
      next();
    } else {
      next(new Error("Authentication error: Invalid API Key"));
    }
  });

  io.on("connection", (socket) => {
    console.log(
      `Socket connected: ${socket.id} with API Key: ${socket.apiKey}, Type: ${socket.clientType}`
    );

    if (!activeApiKeys.has(socket.apiKey)) {
      activeApiKeys.set(socket.apiKey, {
        homeSocket: null,
        mobileSocket: null,
        overlaySockets: new Set(),
      });
      console.log(`Initialized new client entry for API Key: ${socket.apiKey}`);
    }
    const clientEntry = activeApiKeys.get(socket.apiKey);

    if (socket.clientType === "home") {
      if (clientEntry.homeSocket && clientEntry.homeSocket.id !== socket.id) {
        console.log(
          `Disconnecting old home socket ${clientEntry.homeSocket.id} for API Key ${socket.apiKey}`
        );
        clientEntry.homeSocket.disconnect(true);
      }
      clientEntry.homeSocket = socket;
      console.log(`Home client ${socket.id} connected for API Key: ${socket.apiKey}`);
      if (clientEntry.overlaySockets.size > 0) {
        console.log(`Overlay(s) already connected. Emitting overlayConnected to home client ${clientEntry.homeSocket.id} for API Key ${socket.apiKey}`);
        clientEntry.homeSocket.emit("overlayConnected");
        console.log(`Emitted overlayConnected to home client ${clientEntry.homeSocket.id} for API Key ${socket.apiKey}`);
      }
    } else if (socket.clientType === "mobile") {
      // If a mobile socket already exists for this API key, disconnect the old one
      if (
        clientEntry.mobileSocket &&
        clientEntry.mobileSocket.id !== socket.id
      ) {
        console.log(
          `Disconnecting old mobile socket ${clientEntry.mobileSocket.id} for API Key ${socket.apiKey}`
        );
        clientEntry.mobileSocket.disconnect(true);
      }
      clientEntry.mobileSocket = socket;
      console.log(`Mobile client ${socket.id} connected for API Key: ${socket.apiKey}`);
      // If overlays are already connected, notify the newly connected mobile app
      if (clientEntry.overlaySockets.size > 0) {
        console.log(
          `Attempting to emit overlayConnected to newly connected mobile client ${clientEntry.mobileSocket.id} for API Key ${socket.apiKey}`
        );
        clientEntry.mobileSocket.emit("overlayConnected");
        console.log(
          `Emitted overlayConnected to mobile client ${clientEntry.mobileSocket.id} for API Key ${socket.apiKey}`
        );
      }
    } else { // clientType is 'overlay'
      clientEntry.overlaySockets.add(socket);
      console.log(`Overlay client ${socket.id} connected for API Key: ${socket.apiKey}. Total overlays: ${clientEntry.overlaySockets.size}`);
      // If a mobile client is already connected for this API key, notify it that an overlay connected
      if (clientEntry.mobileSocket) {
        console.log(
          `Attempting to emit overlayConnected to mobile client ${clientEntry.mobileSocket.id} for API Key ${socket.apiKey}`
        );
        clientEntry.mobileSocket.emit("overlayConnected");
        console.log(
          `Emitted overlayConnected to mobile client ${clientEntry.mobileSocket.id} for API Key ${socket.apiKey}`
        );
      }
      // Also notify the home client if it's connected
      if (clientEntry.homeSocket) {
        console.log(
          `Attempting to emit overlayConnected to home client ${clientEntry.homeSocket.id} for API Key ${socket.apiKey}`
        );
        clientEntry.homeSocket.emit("overlayConnected");
        console.log(
          `Emitted overlayConnected to home client ${clientEntry.homeSocket.id} for API Key ${socket.apiKey}`
        );
      }
    }

    socket.on("setVerse", (data) => {
      console.log(
        "setVerse received on server:",
        JSON.stringify(data, null, 2)
      );
      clientEntry.overlaySockets.forEach((overlaySocket) => {
        overlaySocket.emit("updateVerse", data);
        console.log(
          `Broadcasting updateVerse to overlay ${overlaySocket.id} for API Key ${socket.apiKey}`
        );
      });
    });

    socket.on("clearVerse", () => {
      console.log("clearVerse received");
      clientEntry.overlaySockets.forEach((overlaySocket) => {
        overlaySocket.emit("clearVerse");
        console.log(
          `Broadcasting clearVerse to overlay ${overlaySocket.id} for API Key ${socket.apiKey}`
        );
      });
    });

    socket.on("setHymn", (data) => {
      console.log("setHymn received on server:", JSON.stringify(data, null, 2));
      clientEntry.overlaySockets.forEach((overlaySocket) => {
        overlaySocket.emit("setHymn", data);
        console.log(
          `Broadcasting setHymn to overlay ${overlaySocket.id} for API Key ${socket.apiKey}`
        );
      });
    });

    socket.on("clearHymn", () => {
      console.log("clearHymn received");
      clientEntry.overlaySockets.forEach((overlaySocket) => {
        overlaySocket.emit("clearHymn");
        console.log(
          `Broadcasting clearHymn to overlay ${overlaySocket.id} for API Key ${socket.apiKey}`
        );
      });
    });

    socket.on("disconnect", () => {
      console.log(
        `Socket disconnected: ${socket.id} with API Key: ${socket.apiKey}, Type: ${socket.clientType}`
      );
      if (!activeApiKeys.has(socket.apiKey)) return; // Entry might have been deleted by mobile disconnect

      const currentClientEntry = activeApiKeys.get(socket.apiKey);

      if (currentClientEntry.homeSocket && currentClientEntry.homeSocket.id === socket.id) {
        currentClientEntry.homeSocket = null;
        console.log(`Home client ${socket.id} disconnected for API Key: ${socket.apiKey}`);
      } else if (
        currentClientEntry.mobileSocket &&
        currentClientEntry.mobileSocket.id === socket.id
      ) {
        currentClientEntry.mobileSocket = null;
        console.log(`Mobile client ${socket.id} disconnected for API Key: ${socket.apiKey}`);
        // If mobile app disconnects, clear all overlays for this API key
        currentClientEntry.overlaySockets.forEach((overlaySocket) =>
          overlaySocket.disconnect(true)
        );
        currentClientEntry.overlaySockets.clear();
      } else if (currentClientEntry.overlaySockets.has(socket)) {
        currentClientEntry.overlaySockets.delete(socket);
        console.log(`Overlay client ${socket.id} disconnected for API Key: ${socket.apiKey}. Remaining overlays: ${currentClientEntry.overlaySockets.size}`);
        // If an overlay disconnects and no other clients are active, notify mobile app and home client
        if (currentClientEntry.overlaySockets.size === 0) {
          if (currentClientEntry.mobileSocket) {
            currentClientEntry.mobileSocket.emit("overlayDisconnected");
            console.log(
              `Emitted overlayDisconnected to mobile client ${currentClientEntry.mobileSocket.id} for API Key ${socket.apiKey}`
            );
          }
          if (currentClientEntry.homeSocket) {
            currentClientEntry.homeSocket.emit("overlayDisconnected");
            console.log(
              `Emitted overlayDisconnected to home client ${currentClientEntry.homeSocket.id} for API Key ${socket.apiKey}`
            );
          }
        }
      }
      // Clean up activeApiKeys entry if all clients for this API key are gone
      if (
        currentClientEntry.homeSocket === null &&
        currentClientEntry.mobileSocket === null &&
        currentClientEntry.overlaySockets.size === 0
      ) {
        activeApiKeys.delete(socket.apiKey);
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
