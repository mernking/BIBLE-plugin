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
    try {
      console.log(
        `Socket connected: ${socket.id} with API Key: ${socket.apiKey}, Type: ${socket.clientType}`
      );

      if (!activeApiKeys.has(socket.apiKey)) {
        activeApiKeys.set(socket.apiKey, {
          homeSocket: null,
          mobileSocket: null,
          overlaySockets: new Set(),
        });
        console.log(
          `Initialized new client entry for API Key: ${socket.apiKey}`
        );
      }
      const clientEntry = activeApiKeys.get(socket.apiKey);

      const handleNewConnection = (type, currentSocket) => {
        if (
          clientEntry[type] &&
          clientEntry[type].id !== currentSocket.id &&
          clientEntry[type].connected
        ) {
          console.log(
            `Disconnecting old ${socket.clientType} socket ${clientEntry[type].id} for API Key ${socket.apiKey}`
          );
          clientEntry[type].disconnect(true);
        }
        clientEntry[type] = currentSocket;
        console.log(
          `${socket.clientType} client ${currentSocket.id} connected for API Key: ${socket.apiKey}`
        );
      };

      if (socket.clientType === "home") {
        handleNewConnection("homeSocket", socket);
        if (clientEntry.overlaySockets.size > 0) {
          socket.emit("overlayConnected");
          console.log(
            `Emitted overlayConnected to home client ${socket.id} for API Key ${socket.apiKey}`
          );
        }
      } else if (socket.clientType === "mobile") {
        handleNewConnection("mobileSocket", socket);
        if (clientEntry.overlaySockets.size > 0) {
          socket.emit("overlayConnected");
          console.log(
            `Emitted overlayConnected to mobile client ${socket.id} for API Key ${socket.apiKey}`
          );
        }
      } else {
        // clientType is 'overlay'
        clientEntry.overlaySockets.add(socket);
        console.log(
          `Overlay client ${socket.id} connected for API Key: ${socket.apiKey}. Total overlays: ${clientEntry.overlaySockets.size}`
        );
        if (clientEntry.mobileSocket) {
          clientEntry.mobileSocket.emit("overlayConnected");
          console.log(
            `Emitted overlayConnected to mobile client ${clientEntry.mobileSocket.id} for API Key ${socket.apiKey}`
          );
        }
        if (clientEntry.homeSocket) {
          clientEntry.homeSocket.emit("overlayConnected");
          console.log(
            `Emitted overlayConnected to home client ${clientEntry.homeSocket.id} for API Key ${socket.apiKey}`
          );
        }
      }

      socket.on("setVerse", (data) => {
        try {
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
        } catch (error) {
          console.error("Error in setVerse event handler:", error);
        }
      });

      socket.on("clearVerse", () => {
        try {
          console.log("clearVerse received");
          clientEntry.overlaySockets.forEach((overlaySocket) => {
            overlaySocket.emit("clearVerse");
            console.log(
              `Broadcasting clearVerse to overlay ${overlaySocket.id} for API Key ${socket.apiKey}`
            );
          });
        } catch (error) {
          console.error("Error in clearVerse event handler:", error);
        }
      });

      socket.on("setHymn", (data) => {
        try {
          console.log(
            "setHymn received on server:",
            JSON.stringify(data, null, 2)
          );
          clientEntry.overlaySockets.forEach((overlaySocket) => {
            overlaySocket.emit("setHymn", data);
            console.log(
              `Broadcasting setHymn to overlay ${overlaySocket.id} for API Key ${socket.apiKey}`
            );
          });
        } catch (error) {
          console.error("Error in setHymn event handler:", error);
        }
      });

      socket.on("clearHymn", () => {
        try {
          console.log("clearHymn received");
          clientEntry.overlaySockets.forEach((overlaySocket) => {
            overlaySocket.emit("clearHymn");
            console.log(
              `Broadcasting clearHymn to overlay ${overlaySocket.id} for API Key ${socket.apiKey}`
            );
          });
        } catch (error) {
          console.error("Error in clearHymn event handler:", error);
        }
      });

      socket.on("disconnect", () => {
        try {
          console.log(
            `Socket disconnected: ${socket.id} with API Key: ${socket.apiKey}, Type: ${socket.clientType}`
          );
          if (!activeApiKeys.has(socket.apiKey)) return;

          const currentClientEntry = activeApiKeys.get(socket.apiKey);

          if (
            currentClientEntry.homeSocket &&
            currentClientEntry.homeSocket.id === socket.id
          ) {
            currentClientEntry.homeSocket = null;
            console.log(
              `Home client ${socket.id} disconnected for API Key: ${socket.apiKey}`
            );
          } else if (
            currentClientEntry.mobileSocket &&
            currentClientEntry.mobileSocket.id === socket.id
          ) {
            currentClientEntry.mobileSocket = null;
            console.log(
              `Mobile client ${socket.id} disconnected for API Key: ${socket.apiKey}`
            );
            // Clear all overlays for this API key when mobile disconnects
            currentClientEntry.overlaySockets.forEach((overlaySocket) => {
              if (overlaySocket.connected) {
                overlaySocket.disconnect(true);
              }
            });
            currentClientEntry.overlaySockets.clear();
          } else if (currentClientEntry.overlaySockets.has(socket)) {
            currentClientEntry.overlaySockets.delete(socket);
            console.log(
              `Overlay client ${socket.id} disconnected for API Key: ${socket.apiKey}. Remaining overlays: ${currentClientEntry.overlaySockets.size}`
            );
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

          if (
            !currentClientEntry.homeSocket &&
            !currentClientEntry.mobileSocket &&
            currentClientEntry.overlaySockets.size === 0
          ) {
            activeApiKeys.delete(socket.apiKey);
            console.log(
              `Cleaned up activeApiKeys for API Key: ${socket.apiKey}`
            );
          }
        } catch (error) {
          console.error("Error in disconnect event handler:", error);
        }
      });
    } catch (error) {
      console.error("Error in connection event handler:", error);
      socket.disconnect(true);
    }
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
