let cache = []
let chatting = false
let peer

const config = {
  'iceServers': [
    {'urls': 'stun:81.4.124.10:3478'},
    {
      'urls': [
        'turn:81.4.124.10:3478?transport=udp'
      ],
      'username': 'screen',
      'credential': 'Yoru3muz'
    }
  ]
}

const socket = new WebSocket(`wss://signal.43z.one?id=2wank`)

async function fillcache(){
  let r = await fetch('https://www.reddit.com/r/porn/top/.json')
  r = await r.json()
  cache = r.data.children.map(x => {
    return x.data.preview.reddit_video_preview.fallback_url
  })
}

fillcache()

b.onclick = e => {
  let url = cache[new Date%cache.length] 
  console.log(url)
  s.src = url
  v.load()
}

function go(){
  navigator.mediaDevices.getUserMedia({
    audio: true
  }).then(gotMedia).catch(() => {})
}
function jsonEscape(str)  {
  return str.replace(/\n/g, "\\\\n").replace(/\r/g, "\\\\r").replace(/\t/g, "\\\\t");
}

function peerStuff(){
  peer = new SimplePeer({
    initiator: true, 
    trickle: true,
    //stream: window.location.hash == '' ? captureStream : false,
    config
  })

  peer.on('error', err => console.log('error', err))

  peer.once('signal', data => {
    console.log('signal event')
    console.log(JSON.stringify(data))
    socket.send(JSON.stringify(data))
  })

  peer.on('connect', () => {
    console.log('peer connection established')
  })

  peer.on('stream', data => {
  })
}

socket.addEventListener('message', event => {
  console.log('signal received via websocket')
  let offer = JSON.parse(event.data)
  if(!chatting) {
    console.log(offer)
    peer.signal(offer)
  }
})

socket.addEventListener('open', peerStuff)
