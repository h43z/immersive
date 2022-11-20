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
        viewers.innerText = `${obj.d} 👥`
      break;
    }
  }

  ws.onerror = _ => ws.close()
  ws.onclose = _ => setTimeout(connect, 1000)
}


input.addEventListener('input', event => {
  if(/^[a-z0-9-+"']+$/i.test(event.data) || !ws.readyState)
    return

  ws.send(input.value.trim())
  input.value = ''
})

input.addEventListener('keyup', event => {
  if(event.key !== 'Enter' || !ws.readyState)
    return

  ws.send(input.value.trim())
  input.value = ''
})


const display = obj => {
  const msg = document.createElement('div')

  msg.style.textDecorationColor = obj.c 
  msg.classList.add('msg', obj.o ? 'own' : 'other')
  msg.innerText = obj.d

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
}

input.focus()
connect()
