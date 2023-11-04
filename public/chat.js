let ws = null
let chatCleanUp = null
let lastMsgElement = null

const connect = _ => {
  const room = location.pathname.split('/')[1] || 'main'
  let url

  if(document.domain !== 'chat.43z.one'){
    url = `ws://${document.domain}:3035`
  }else{
    url = `wss://${document.domain}`
  }

  ws = new WebSocket(`${url}/ws?room=${room}`)
  ws.onmessage = e => {
    const obj = JSON.parse(e.data)
    switch(obj.a){
      case 1:
        display(obj)
      break;
      case 2:
        riseup(obj)
        heart(obj)
      break;
      case 3:
        heart(obj)
      break;
    }
  }

  ws.onerror = _ => ws.close()
  ws.onclose = _ => setTimeout(connect, 1000)
}

input.addEventListener('input', event => {
  if(/^[äöüßa-z0-9-+"']+$/i.test(event.data) || !ws.readyState)
    return

  send({a:1,d:input.value.trim()})
  clear()
})

// needed because oninput does not register ENTER key
input.addEventListener('keyup', event => {
  if(event.key !== 'Enter' || !ws.readyState)
    return

  send({a:1,d:input.value.trim()})
  clear()
})

const riseup = obj => {
  if(obj.d)
    viewers.innerText = `${obj.d} 👥`

  if(viewers.classList.contains('riseup'))
    return

  viewers.offsetWidth
  viewers.classList.add('riseup')
  viewers.onanimationend = e => viewers.classList.remove('riseup')
}

const clear = _ => {
  input.value = ''
  keyboard && keyboard.clearInput()
}

const heart = obj => {
  const div = document.createElement('div')
  div.innerText = '💜'
  div.className = 'heart'
  div.style.textShadow = `0 0 0 ${obj.c}`
  div.style.right = `${Math.floor(Math.random()*30)}px`
  div.style.transform = `rotate(${(Math.random() - 0.5) * 2*40}deg)`
  div.onanimationend = e => e.target.remove()
  chat.appendChild(div)
}

const display = obj => {
  const msg = document.createElement('div')

  msg.style.textDecorationColor = obj.c
  msg.classList.add('msg', obj.o ? 'own' : 'other')
  msg.innerText = obj.d

  if(lastMsgElement && lastMsgElement.className !== msg.className)
    lastMsgElement.style.paddingRight = '15px'

  chat.appendChild(msg)

  lastMsgElement = msg

  msg.scrollIntoView()

  // kind of a problem. the cleanup won't happen
  // if chat keeps on receiving messages
  clearTimeout(chatCleanUp)

  chatCleanUp = setTimeout(_=> {
    document.querySelector('#chat').innerHTML = ''
  }, 8000)
}

// send hearts by clicking into the chat
app.onmousedown = e => {
  if(e.target !== input)
    e.preventDefault()

  if(document.activeElement === input)
    e.preventDefault()

  if(e.target === app || e.target === chat)
    send({a:3})
}

const send = obj => {
  ws.send(JSON.stringify(obj))
}

connect()
input.focus()
