const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Client website को serve करना
app.use(express.static(path.join(__dirname, "client")));

// Client connect होने पर
io.on("connection", (socket) => {

    console.log("Client connected:", socket.id);

    // Client से message receive करना
    socket.on("chat message", (message) => {

        console.log("Message received:", message);

        // सभी connected clients को message भेजना
        io.emit("chat message", {
            senderId: socket.id,
            message: message
        });
    });

    // Client disconnect
    socket.on("disconnect", () => {

        console.log("Client disconnected:", socket.id);

    });

});

// Server start
server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
});

