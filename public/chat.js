let ws = null
let chatCleanUp = null
let lastMsgElement = null

const connect = _ => {
  const room = location.pathname.split('/')[1]
  ws = new WebSocket(`wss://${document.domain}/ws?room=${room ? room : 'main'}`)

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
        riseup(obj)
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
  input.value = ''
  if(keyboard)
    keyboard.clearInput()
})

input.addEventListener('keyup', event => {
  if(event.key !== 'Enter' || !ws.readyState)
    return

  send({a:1,d:input.value.trim()})
  input.value = ''
  if(keyboard)
    keyboard.clearInput()
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

const heart = obj => {
  const div = document.createElement('div')
  div.innerText = '💜'
  div.className = 'heart'
  div.style.textShadow = `0 0 0 ${obj.c}`
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

  clearTimeout(chatCleanUp)

  chatCleanUp = setTimeout(_=> {
    document.querySelector('#chat').innerHTML = ''
  }, 8000)
}

window.onresize = e => {
  if(lastMsgElement)
    lastMsgElement.scrollIntoView()

  const vks = Math.min(app.clientWidth/screen.width, app.clientHeight/screen.height) < 0.7

  if(!vks)
    input.blur()
}

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
