var host = window.location.host;
var url = `ws:\/\/${host}/ws`;
console.log(`Opening WS(${url}).`);
var ws = new WebSocket(url);

function onopen() {
  console.log("datachannel onopen.");
  data.data['open'] = true;
};
function onclose() { console.log("[datachannel] onclose."); };
function ondatachannel() { console.log("[datachannel] ondatachannel"); };
function onmessage(e) { console.log("[datachannel] onmessage"); }
function onicecandidate(e) { console.log(`onicecandidate ${e}.`); };

var peer = {};
var dataChannel = {};

const handler = {
  set(target, key, value) {
    //console.log(`Setting key(${key}) to value(${value})`);
    if (key == 'open') {
      data.onready()
    }
    target[key] = value;
  }
}
var data = {
  'open': false
};
data.data = new Proxy(data, handler);
data.onready = function() {
  debugger;
};

const handleOffer = function(offer) {
  console.log("handleOffer");
  console.log("creating answer sdp.");
  if (context.context == 'target') {
    console.log("creating a peer connection.");
    peer = new RTCPeerConnection();
    peer.onicecandidate = function(e) {
      if (!e.candidate) {
        return;
      }
      let data = {
        'type': 'icecandidate',
        'candidate': e.candidate
      }
      ws.send(JSON.stringify(data));
    };
    console.log("creating data channel.");
    dataChannel = peer.createDataChannel("data");
    console.log("assigning callbacks.");
    dataChannel.onmessage = onmessage;
    dataChannel.onopen = onopen;
    peer.ondatachannel = ondatachannel;
    console.log("setting local description to peer offer.");
    peer.setRemoteDescription(offer);
    console.log("creating an answer.");
    peer.createAnswer()
    .then(function(answer) {
      console.log("setting local description to answer.")
      peer.setLocalDescription(answer);
      return answer;
    })
    .then(function(answer) {
      console.log("sending answer.");
      console.log(answer);
      answer = JSON.stringify(answer);
      ws.send(answer);
      console.log("answer sent.");
    })
    .catch(function(e) {
      console.log("exception handling offer.");
      console.log(e);
    });
  } else {
    debugger;
  }

}

const handleAnswer = function(answer) {
  console.log("handleAnswer");
  peer.setRemoteDescription(answer)
  .catch(e => console.log("error handline answer."));
}

const handleIceCandidate = function(data) {
  console.log("adding peer ice candidate.");
  peer.addIceCandidate(data.candidate);
}

const handleAddCandidateError = function(e) {
  console.log("ERROR adding ice candidate.");
  console.log(e);
}

const initiatePeerConnection = function() {
  console.log('initiating peer connection');
  peer = new RTCPeerConnection();
  peer.onicecandidate = function(e) {
    if (!e.candidate) {
      return;
    }
    let data = {
      'type': 'icecandidate',
      'candidate': e.candidate
    }
    ws.send(JSON.stringify(data));
  };
  console.log("creating data channel.");
  dataChannel = peer.createDataChannel("data");
  console.log("assigning callbacks.");
  dataChannel.onmessage = onmessage;
  dataChannel.onopen = onopen;
  peer.ondatachannel = ondatachannel;
  peer.createOffer()
  .then(function(offer) {
    console.log("setting description.");
    peer.setLocalDescription(offer);
    console.log("sending offer.");
    offer = JSON.stringify(offer);
    ws.send(offer);
    console.log("sent offer.");
  })
  .catch(function(e) {
    console.log("exception creating offer.");
  });
}

var context = { 'context' : 'target' }
const handleCommand = function(data) {
  if (data.command == 'set-context') {
    context.context = data.context;
  }

  if (context.context == 'initiator') {
    console.log('context is initiator.');
    initiatePeerConnection();
  }

  if (context.context == 'target') {
    console.log('context is target.');
  }
}

ws.onmessage = function(ev) {
  var data = JSON.parse(ev.data);

  // Enter command mode.
  if (data.hasOwnProperty('command')) {
    handleCommand(data);
    return;
  }

  // Otherwise we are processing an SDP.
  var sdp = data;
  if (sdp.type == "offer") {
    console.log("offer received.");
    handleOffer(sdp);
    return;
  }

  if (sdp.type == "answer") {
    console.log("answer received.");
    handleAnswer(sdp);
    return;
  }

  if (sdp.type == 'icecandidate') {
    handleIceCandidate(sdp);
  };
};


ws.onopen = function() {
  console.log('websocket open.');
}


