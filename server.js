import next from "next";
import http from "http";
import initializeSocket from "./server/socketServer.js";

const dev = process.env.NODE_ENV !== "production";
const port = process.env.PORT || 3000;
const app = next({ dev });

const handle = app.getRequestHandler();

app.prepare().then(() => {

    const server = http.createServer(
        (req, res) => handle(req, res)
    );

    initializeSocket(server);
    // console.log(dev)
    // console.log(process.env.NEXT_PUBLIC_LOCAL_API_URL)
    // console.log(API)

    server.listen(port, () => {
        console.log("Server running at localhost:3000");
    });

});