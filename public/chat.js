let ws = null
let autoClearChat = null

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
    console.log('received', obj)
    switch(obj.action){
      case 'heart':
        showHeart(obj)
        break;
      case 'text':
        showText(obj)
        break;
      case 'endofword':
        getLastUserWord(obj.uid)?.classList.add('end')
        break;
      case 'usercount':
        updateUserCount(obj)
        showHeart(obj)
      break;
    }

    if(obj.action === 'text'){
      clearTimeout(autoClearChat)
      autoClearChat = setTimeout(_=> {
        chat.innerHTML = ''
      }, 8000)
    }
  }

  ws.onerror = _ => ws.close()
  ws.onclose = _ => setTimeout(connect, 1000)
}

const showText = obj => {
  // there is still a condition to fix
  // what if user joins mid word

  let lastUserWord = getLastUserWord(obj.uid)

  if(!lastUserWord){
    lastUserWord = createEmptyWord(obj)
    chat.appendChild(lastUserWord)
  }

  let chars = lastUserWord.querySelectorAll('.char')
  const addChars = []

  if(obj.data.position === 0 && obj.data.value.length === 0){
    lastUserWord.innerHTML = ''
    lastUserWord.style.marginLeft = 0
  }

  for(let i = 0; i < (obj.data.value.length || 1); i++){
    const pos = obj.data.position
    if(chars[pos + i]){
      // update an existing char value
      if(obj.data.value.length === 0){
        chars[pos + i].classList.add('deleted')
      }else{
        chars[pos + i].innerText = obj.data.value[i]
        chars[pos + i].classList.remove('deleted')
      }
    }else{
      const newChar = createChar(i, obj)
      lastUserWord.appendChild(newChar)
    }
  }

  lastUserWord.scrollIntoView()

  return
}

const createChar = (index, obj) => {
  const char = document.createElement('span')
  char.classList.add('char', obj.own ? 'own' : 'other')
  char.style.textDecorationColor = obj.color
  char.innerText = obj.data.value[index]
  return char
}

const createEmptyWord = obj => {
  const word = document.createElement('div')
  word.style.color = obj.color
  word.classList.add(`word`, `user-${obj.uid}`)
  return word
}

const getLastUserWord = uid => {
  return chat.querySelector(`.word.user-${uid}:not(.end)`)
}

const clearInput = _ => {
  setTimeout(_=>input.value = '', 0)
  keyboard && keyboard.clearInput()
}

const showHeart = obj => {
  const div = document.createElement('div')
  div.innerText = '💙'
  div.className = 'heart'
  div.style.textShadow = `0 0 0 ${obj.own ? '#59778b': obj.color}`
  div.style.right = `${Math.floor(Math.random()*30)}px`
  div.style.transform = `rotate(${(Math.random() - 0.5) * 2*40}deg)`
  div.onanimationend = e => e.target.remove()
  // cannot append it to chat
  // because there is a bug
  // hearts won't show up after some time
  // flex box and absolute item weird behavior...
  app.appendChild(div)
}

let prevVal = ''
let autoClearInput = null

input.addEventListener('input', event => {
  clearTimeout(autoClearInput)

  send({input: {
    data: event.data,
    key: event.key,
    inputValue: input.value
  }})

  let endOfWord = false
  let val = input.value

  if(val.trim() === '' && prevVal === ''){
    send({action: 'heart'})
    clearInput()
    return
  }

  if(
    val.endsWith(`, `) ||
    val.endsWith(`. `) ||
    val.endsWith(`? `) ||
    val.endsWith(`! `)
  ){
    // catch automatic space insertion of microsoft swiftkey after punctuation
    return
  }

  if(
    val.endsWith(` `) ||
    val.endsWith(`.`) ||
    val.endsWith(`,`) ||
    val.endsWith(`!`) ||
    val.endsWith(`?`) ||
    val.endsWith(`\n`) ||
    /\p{Extended_Pictographic}/u.test(val)
  ){
    endOfWord = true
  }

  val = val.trim()

  const pChars = [...prevVal]
  const chars = [...val]

  for(let i = 0; i < Math.max(chars.length, pChars.length); i++){
    if(pChars[i] !== chars[i]){

      if(i === 0 && chars.length === 0){
        // but careful this also happens sometimes on gboard suggestions
        // eg. wieder -> Wiedersehen
        // or it means deleted the whole word with backspace
        // mark it as end of the word
        endOfWord = true
      }
      send({
        action: 'text',
        data: {
          position: i,
          value: chars.slice(i)
        }
      })
      break;
    }
  }

  if(endOfWord){
    send({action: 'endofword'})
    clearInput()
    prevVal = ''
  }else{
    prevVal = val
  }

  autoClearInput = setTimeout(_=> {
    clearInput()
    send({action: 'endofword'})
    prevVal = ''
  }, 2000)
})

const updateUserCount = obj => {
  if(obj.data)
    viewers.innerText = `${obj.data} 👥`

  if(viewers.classList.contains('riseup'))
    return

  viewers.offsetWidth
  viewers.classList.add('riseup')
  viewers.onanimationend = e => viewers.classList.remove('riseup')
}

// send hearts by clicking into the chat
app.onmousedown = e => {
  if(e.target !== input)
    e.preventDefault()

  if(document.activeElement === input)
    e.preventDefault()

  if(e.target === app || e.target === chat)
    send({action: 'heart'})
}

const send = obj => {
  console.log('sending',obj)
  ws.send(JSON.stringify(obj))
}

connect()
input.focus()
