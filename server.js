const express = require("express");
const app = express();

var broadcasters = [];
const port = process.env.PORT || 4000;

const http = require("http");
const server = http.createServer(app);

const io = require("socket.io")(server);
app.use(express.static(__dirname + "/public"));

io.sockets.on("error", e => console.log(e));

io.sockets.on("connection", socket => {
  
  socket.on("broadcaster", (broadcaster) => {
    console.log("broadcaster")

    if(broadcasters.findIndex(x => x.pcid == broadcaster.pcid) == -1 ){
      broadcasters.push(broadcaster);
      
    }else{
      broadcasters[broadcasters.findIndex(x => x.pcid == broadcaster.pcid)].socketID = socket.id;
    }

    console.log(broadcasters)
    
    socket.broadcast.emit("broadcaster-list-update",broadcasters);
  });
  
  socket.on("offer", (id, message) => {
    socket.to(id).emit("offer", socket.id, message);
  });
  socket.on("answer", (id, message) => {
    socket.to(id).emit("answer", socket.id, message);
  });
  socket.on("candidate", (id, message) => {
    socket.to(id).emit("candidate", socket.id, message);
  });
  socket.on("disconnect", (watcherID) => {
    socket.to(watcherID).emit("disconnectPeer", socket.id);
  });

  socket.on("watcher", () => {
    io.to(socket.id).emit("broadcaster-list", broadcasters);
  });

  socket.on("connect-to", (broadcasterID) => {
    socket.to(broadcasterID).emit("watcher", socket.id);
  });

  socket.on("mouse-move", (mouse) => {
    socket.to(mouse.SocketID).emit("mouse-move", mouse);
  });

  socket.on("mouse-click", (id) => {
    socket.to(id).emit("mouse-click");
  });


});
server.listen(port, () => console.log(`Server is running on port ${port}`));
