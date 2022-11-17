const ws = new WebSocket(`ws://${document.domain}/ws`)
let lastMsgTimer = null

ws.onmessage = e => {
  const obj = JSON.parse(e.data)
  console.log(e.data)
  display(obj)
}

input.addEventListener('keyup', event => {
  if(event.key === "Enter" || input.value.charCodeAt(input.value.length -1) == 32){
    ws.send(input.value)
    input.value = ""
  }
})

const display = obj => {
  clearTimeout(lastMsgTimer)

  chat.style = `height: ${document.documentElement.clientHeight - input.offsetHeight - 10}px`

  const s = document.createElement('span')
  s.innerText = obj.msg
  s.style.color = obj.own ? 'black' : obj.color
  s.className = `msg`
  chat.appendChild(s)
  s.scrollIntoView()
  
  lastMsgTimer = setTimeout(_=>{
    document.querySelectorAll('.msg').forEach(item => {
      item.remove()
    })
  }, 3200)
}
