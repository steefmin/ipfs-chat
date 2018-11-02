const options = {
  repo: 'ipfs-' + Math.random(),
  config: {
    Addresses: {
      Swarm: [
        '/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star'
      ]
    }
  },
  EXPERIMENTAL: {
    pubsub: true
  }
}

const $nodestatus = document.querySelector('#nodestatus')
const $peercount = document.querySelector('#peercount')

const $messagebox = document.querySelector('#messagebox')
const $chatsend = document.querySelector('#chat-send')
const $chatmessage = document.querySelector('#chat-message')
const $chatname = document.querySelector('#chat-name')

let appLink = ''
const pubsubpairs = {
  'chat': chathandler
}
let NODE_ID
let myfile

function onReady () {
  if (window.location.pathname.startsWith('/ipfs/Qm')) {
    appLink = window.location.pathname
  }
  $nodestatus.innerText = 'loading'
  node.id(function (err, data) {
    if (err) throw err
    $nodestatus.innerText = 'alive'
    let div = document.createElement('div')
    NODE_ID = data.id
    div.innerText = ' powered by ' + data.agentVersion.split('/')[0]
    div.style.display = 'inline'
    $nodestatus.appendChild(div)
    updatePeers()
    subscribePubsub(pubsubpairs)
    enableButtons()
    console.log(NODE_ID)

    node.files.get('QmZQaqrtPCdYohZ2XBdnia2PdRX3oKGuhtHj6WjUBvnoVy', function (err, files) {
      if (err) throw err
      files.forEach(function (file) {
        myfile = file.content.toString('utf8')
      })
    })
  })
}

function subscribePubsub (pairs) {
  for (let topic in pairs) {
    node.pubsub.subscribe(topic, pairs[topic])
  }
}

function enableButtons () {
  $chatsend.addEventListener('click', function () {
    if ($chatmessage.value !== '') {
      node.pubsub.publish('chat', node.types.Buffer.from(JSON.stringify({
        text: $chatmessage.value,
        name: $chatname.value,
        applink: appLink,
        ts: Date.now()
      })))
      $chatmessage.value = ''
    }
  })
  $chatmessage.addEventListener('keyup', function (event) {
    if (event.keyCode === 13) {
      $chatsend.click()
    }
  })
}

let previousScrollHeight = 800
function chathandler (msg) {
  let message = document.createElement('div')
  let messagebar = document.createElement('div')
  let msgJson = JSON.parse(msg.data.toString())
  // message.innerHTML = messageContentFromSubMsg(msgJson)
  message.appendChild(messageContentFromSubMsg(msgJson))
  message.classList.add('message')
  messagebar.classList.add('messagebar')
  if (msg.from === NODE_ID) {
    message.classList.add('fromMe')
  }
  messagebar.appendChild(message)
  $messagebox.appendChild(messagebar)
  let addedScroll = $messagebox.scrollHeight - previousScrollHeight
  let currentScroll = $messagebox.scrollHeight - $messagebox.scrollTop
  let userHasScrolled = currentScroll - addedScroll > $messagebox.clientHeight
  if (!userHasScrolled) {
    $messagebox.scrollTop = $messagebox.scrollHeight
  }
  previousScrollHeight = $messagebox.scrollHeight
}

function messageContentFromSubMsg (msgObj) {
  console.log(msgObj)
  if (msgObj.name && msgObj.text && msgObj.ts) {
    let maindiv = document.createElement('div')
    let namediv = document.createElement('div')
    namediv.classList.add('message-name')
    let textdiv = document.createElement('div')
    textdiv.classList.add('message-text')
    let tsdiv = timeformat(msgObj.ts)
    namediv.innerText = msgObj.name + ': '
    textdiv.innerText = msgObj.text
    maindiv.appendChild(tsdiv)
    maindiv.appendChild(namediv)
    maindiv.appendChild(textdiv)
    return maindiv
  }
  return msgObj
}

function timeformat (ts) {
  let t = new Date(ts)
  let div = document.createElement('div')
  div.classList.add('message-time')
  div.innerText = t.getHours() + ':' + t.getMinutes()
  return div
}

function updatePeers () {
  document.querySelector('.hidden').style.display = 'inline'
  node.swarm.peers(function (err, peers) {
    if (err) throw err
    $peercount.innerText = peers.length
  })
  setTimeout(updatePeers, 5000)
}

/* global Ipfs */
/* from ipfs.js file */
const node = new Ipfs(options)

node.once('ready', onReady)
