let peerConnection;
const config = {
  iceServers: [
      { 
        "urls": "stun:stun.l.google.com:19302",
      },
      // { 
      //   "urls": "turn:TURN_IP?transport=tcp",
      //   "username": "TURN_USERNAME",
      //   "credential": "TURN_CREDENTIALS"
      // }
  ]
};

const socket = io.connect(window.location.origin);

const video = document.querySelector("video");


socket.on("offer", (id, description) => {
  peerConnection = new RTCPeerConnection(config);
  peerConnection
    .setRemoteDescription(description)
    .then(() => peerConnection.createAnswer())
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(() => {
      socket.emit("answer", id, peerConnection.localDescription);
    });
  peerConnection.ontrack = event => {
    video.srcObject = event.streams[0];
  };
  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("candidate", id, event.candidate);
    }
  };
});


socket.on("candidate", (id, candidate) => {
  peerConnection
    .addIceCandidate(new RTCIceCandidate(candidate))
    .catch(e => console.error(e));
});

socket.on("connect", () => {
  console.log("connect: " + socket.id);
  socket.emit("watcher",socket.id);
});

socket.on("broadcaster-list-update", () => {
  console.log("broadcaster")
  socket.emit("watcher",socket.id);
});

socket.on("broadcaster-list", (broadcasters) => {
  console.log("broadcaster-list: " + broadcasters[0]);
  document.querySelectorAll('.broadcaster').forEach(broadcaster => {
    broadcaster.addEventListener('click', event => {
      video.addEventListener('mousemove', e => {
        var posX = e.offsetX;
        var posY = e.offsetY;
        socket.emit("mouse-move", {"posX":posX, "posY": posY, "SocketID": broadcasters[0].socketID})
    });
      //handle click
      socket.emit("connect-to", broadcasters[0].socketID);
    })
    broadcaster.innerHTML = '<p>' + broadcasters[0].pcid + "</p>";
  })
});

window.onunload = window.onbeforeunload = () => {
  socket.close(socket.id);
  peerConnection.close();
};





