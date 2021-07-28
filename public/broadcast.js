
// var robot = require('robotjs');
const peerConnections = {};

const config = {
    iceServers: [
        {
            "urls": "stun:stun.l.google.com:19302",
        },
    ]
};

const socket = io.connect(window.location.origin);

socket.on("connect", () => {
    const statustext = document.querySelector(".statustext");
    statustext.textContent = "Connected to server"
    socket.emit("broadcaster", { socketID: socket.id, pcid: "1CG-CPT-DEV02" });
});

socket.on("mouse-move", (mouse) => {
    //robot.moveMouse(mouse.posX, mouse.posY);
});

socket.on("mouse-click", () => {
    //robot.mouseClick();
});

socket.on("answer", (id, description) => {
    peerConnections[id].setRemoteDescription(description);
    console.log("answer")
});

socket.on("watcher", async id => {
    console.log("watcher")
    const peerConnection = new RTCPeerConnection(config);
    peerConnections[id] = peerConnection;

    if (window.stream) {
        window.stream.getTracks().forEach(track => {
            track.stop();
        });
    }

    const inputSources = await desktopCapturer.getSources({
      types: ['screen']
    });

    console.log(inputSources);

    const constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: "screen:0:0"//69732864
            }
        }
    };

    let stream = await navigator.mediaDevices.getUserMedia(constraints);
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit("candidate", id, event.candidate);
        }
    };

    peerConnection
        .createOffer()
        .then(sdp => peerConnection.setLocalDescription(sdp))
        .then(() => {
            socket.emit("offer", id, peerConnection.localDescription);
        });
});

socket.on("candidate", (id, candidate) => {
    console.log("candidate")
    peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on("disconnectPeer", id => {
    peerConnections[id].close();
    delete peerConnections[id];
});

window.onunload = window.onbeforeunload = () => {
    socket.close();
};