const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const Firecrawl = require("firecrawl");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("startCrawl", async (data) => {
    const crawler = new Firecrawl({
      url: data.url,
      maxDepth: data.maxDepth || 2,
      maxPages: data.maxPages || 10,
    });

    crawler.on("data", (crawlData) => {
      socket.emit("crawlData", crawlData);
    });

    crawler.on("error", (error) => {
      socket.emit("crawlError", error.message);
    });

    crawler.on("done", () => {
      socket.emit("crawlDone");
    });

    try {
      await crawler.start();
    } catch (error) {
      socket.emit("crawlError", error.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
