const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
// Bind to your Wi-Fi IP so other devices can connect
const hostname = process.env.IP;
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

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("setVerse", (data) => {
      console.log("setVerse received:", data);
      io.emit("updateVerse", data);
    });

    socket.on("clearVerse", () => {
      console.log("clearVerse received");
      io.emit("clearVerse");
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://0.0.0.0:${port}`);
    console.log(
      `> Access it via http://YOUR_LOCAL_IP:${port} on other devices`
    );
  });
});
