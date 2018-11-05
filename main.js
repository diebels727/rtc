'use strict';

let local;
let remote;
let tx;
let rx;

function stateChange() {
  console.log("stateChange()");
}

function txOfferDescriptionSuccess(record) {
  console.log(record);
  record = JSON.parse(record);
  var id = record.id;
  var url = `http://localhost:8888/peers/${id}`;
  $.ajax({
    type: 'GET',
    url: url,
    success: function(data) {
      console.log("txGetIces: Success!!!");
      console.log(data);
    },
    async: false
  });
}

function txOfferDescription(data) {
  local.setLocalDescription(data);
  console.log(`txOfferDescription setting local description(${data}) ...`);

  /*
  var request = new XMLHttpRequest();
  request.open("POST", "http://localhost:8888/ices");
  request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  request.send(JSON.stringify(sdp), true);
  console.log('response');
  console.log(request.response);
  */
  var url = "http://localhost:8888/ices";
  $.post(url, JSON.stringify(data), txOfferDescriptionSuccess);

  // Probably done via signalling
  //remote.setRemoteDescription(desc);
  //console.log(`txOfferDescription setting remote description(${desc}) ...`);
  //remote.createAnswer().then(
  //  rxOfferDescription,
  //  rxOfferDescriptionError
  //);
  //console.log(`txOfferDescription remote create answer ...`);
}

function rxOfferDescription(desc) {
  remote.setLocalDescription(desc);
  console.log(`rxOfferDescription setting local description(${desc}) ...`);

  // Probably done via signalling
  local.setRemoteDescription(desc);
  console.log(`rxOfferDescriptions setting remote description(${desc}) ...`);
}

function txOfferDescriptionError(error) {
  console.log(error);
}

function rxOfferDescriptionError(error) {
  console.log(error);
}

var utils = {
  getotherpc: function(pc){
    if (pc === local) {
      return remote;
    }
    return local;
  },
  getname: function(pc) {
    if (pc === local) {
      return 'local';
    }
    return 'remote';
  }
}

function onaddicecandidatesuccess(pc) {
  console.log('onaddicecandidatesuccess! :)');
}

function onaddicecandidateerror(pc, err) {
  console.log('onaddicecandidatefailure. :(');
}

function onicecandidate(pc, event) {
  console.log('onicecandidate ...');
  if (typeof(utils) === 'undefined') {
    debugger;
  }
  //utils.getotherpc(pc)
  //  .addIceCandidate(event.candidate)
  //  .then(
  //    () => onaddicecandidatesuccess(pc),
  //    err => onaddicecandidatefailure(pc, err)
  //  );
  console.log(`${utils.getname(pc)} ICE candidate: ${event.candidate ? event.candidate.candidate : '(null)'}`);
}

const servers = null;

function localOnOpen() {
  console.log('local onopen ...');
}

function localOnClose() {
  console.log('local onclose ...');
}


function createTxConnection() {
  console.log("createTxConnection");
  local = new RTCPeerConnection(servers);
  tx = local.createDataChannel('tx');
  console.log(`created transmit channel(${tx}) ...`);

  local.onicecandidate = function(e) {
    console.log(e);
    console.log('local onicecandidate ...');
    onicecandidate(local, e);
  };

  local.onopen = localOnOpen;
  local.onclose = localOnClose;

  local.createOffer().then(
    txOfferDescription,
    txOfferDescriptionError
  );
}

function createRxConnection() {
  console.log("createRxConnection");
  var remote = new RTCPeerConnection(servers);
  var rx = remote.createDataChannel('rx');
  console.log(`created receive channel(${rx}) ...`);

}

//createRxConnection();
createTxConnection();

