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

const NODE_STATUS = document.querySelector('#nodestatus')
const PEER_COUNT = document.querySelector('#peercount')

const MESSAGE_BOX = document.querySelector('#messagebox')
const USER_LIST = document.querySelector('#userlist')
const CHAT_SEND = document.querySelector('#chat-send')
const CHAT_MESSAGE = document.querySelector('#chat-message')
const CHAT_NAME = document.querySelector('#chat-name')

let userlist = [];

const date = new Date()
CHAT_NAME.value = 'anonymous-' + date.getUTCMilliseconds()

let appLink = 'https://chat.steefmin.xyz'
const pubsubpairs = {
  'chat': chathandler
}
let NODE_ID

function onReady () {
  if (window.location.pathname.startsWith('/ipfs/Qm')) {
    appLink = window.location.pathname
  }

  NODE_STATUS.innerText = 'loading'

  node.id(function (err, data) {
    if (err) throw err
    NODE_STATUS.innerText = 'alive'
    let div = document.createElement('div')
    NODE_ID = data.id
    div.innerText = ' powered by ' + data.agentVersion.split('/')[0]
    div.style.display = 'inline'
    NODE_STATUS.appendChild(div)
    updatePeers()
    subscribePubsub(pubsubpairs)
    enableButtons()
    console.log(NODE_ID)
  })
}

function subscribePubsub (pairs) {
  for (let topic in pairs) {
    node.pubsub.subscribe(topic, pairs[topic])
  }
}

function enableButtons () {
  CHAT_SEND.addEventListener('click', function () {
    if (CHAT_MESSAGE.value !== '') {
      node.pubsub.publish('chat', window.Ipfs.Buffer.from(JSON.stringify({
        text: CHAT_MESSAGE.value,
        name: CHAT_NAME.value,
        applink: appLink,
        id: NODE_ID,
        ts: Date.now()
      })))
      CHAT_MESSAGE.value = ''
    }
  })
  CHAT_MESSAGE.addEventListener('keyup', function (event) {
    if (event.keyCode === 13) {
      CHAT_SEND.click()
    }
  })
}

let previousScrollHeight = 800
function chathandler (msg) {
  let message = document.createElement('div')
  let messagebar = document.createElement('div')
  let msgJson = JSON.parse(msg.data.toString())
  message.appendChild(messageContentFromSubMsg(msgJson))
  message.classList.add('message')
  messagebar.classList.add('messagebar')
  if (msg.from === NODE_ID) {
    message.classList.add('fromMe')
  }
  messagebar.appendChild(message)
  MESSAGE_BOX
    .appendChild(messagebar)
  let addedScroll = MESSAGE_BOX
    .scrollHeight - previousScrollHeight
  let currentScroll = MESSAGE_BOX
    .scrollHeight - MESSAGE_BOX
    .scrollTop
  let userHasScrolled = currentScroll - addedScroll > MESSAGE_BOX
    .clientHeight
  if (!userHasScrolled) {
    MESSAGE_BOX
      .scrollTop = MESSAGE_BOX
        .scrollHeight
  }
  previousScrollHeight = MESSAGE_BOX
    .scrollHeight
  upsertUserlist(msgJson)
}

function messageContentFromSubMsg (msgObj) {
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
  return document.createElement('div').innerText(msgObj.toString())
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
    PEER_COUNT.innerText = peers.length
  })
  updateUserList()
  setTimeout(updatePeers, 5000)
}


function upsertUserlist (msgJson) {
  userlist = userlist.filter(function (user) {
    return user.id !== msgJson.id
  })
  userlist.unshift(
    {
      id: msgJson.id,
      name: msgJson.name
    }
  )
  updateUserList()
}

function updateUserList () {
  USER_LIST.innerHTML = ''
  userlist.map(function (user) {
    USER_LIST.append(createName(user.name))
  })
}

function createName (name) {
  let el = document.createElement('div')
  el.classList.add('name')
  el.innerHTML = name
  return el
}

/* global Ipfs */
/* from ipfs.js file */
const node = new Ipfs(options)

node.once('ready', onReady)
