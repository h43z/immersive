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
    console.log('received', obj)
    switch(obj.a){
      case 1:
        append(obj)
      break;
      case 2:
        riseup(obj)
        heart(obj)
      break;
      case 3:
        heart(obj)
      break;
      case 4:
        replace(obj)
      break;
      case 5:
        //mark end of word
        endWord(obj)
      break;
    }
  }

  ws.onerror = _ => ws.close()
  ws.onclose = _ => setTimeout(connect, 1000)
}

// chrome is a mess https://bugs.chromium.org/p/chromium/issues/detail?id=118639
// test if this all works in safari
input.addEventListener('input', event => {
  //console.log(event)
  //alert(`${event.inputType} |${event.data}| |${input.value}| ${event.data.length}`)

  if(!ws.readyState)
    return

  // on space send a heart if input is otherwise empty
  // has to be the first check
  if(event.inputType === 'insertText' && event.data === ' ' && input.value === ' '){
    send({a:3})
    clear()
    return
  }

  if(
    input.value.endsWith(' ') ||
    input.value.endsWith('.') ||
    input.value.endsWith(',') ||
    input.value.endsWith('!') ||
    input.value.endsWith('?') ||
    event.inputType === 'insertLineBreak'
  ){
    clear()

    //// workaround swiftkey keyboard
    //// if word ends with . two events are fired
    //// last one is just a space so ignore
    //if(!input.value.endsWith(' '))

    if(event.data?.trim().length)
      send({a:1,d:event.data.trim()})

    send({a:5})
    return
  }

  // detect normal typing, charachter by character
  // event.data === ' ' for swiftkey on autocomplete press
  if(event.inputType === 'insertText' && event.data.length === 1 && event.data !== ' '){
    send({a:1,d:event.data})
  }

  // detect autocomplete, pressing on suggested word on virtual keyboard
  // if detected replace the full word, below works for gboard
  // ends last word
  if((event.inputType === 'insertText' || event.inputType === 'insertFromPaste') && event.data.length > 1){
    send({a:4,d:input.value.trim()})
    send({a:5})
  }

  // below detects autocomplete for mircosoft swiftkey
  // ends last word
  if(event.inputType === 'insertCompositionText'){
    // weird behavoir every pressing of . triggers insertComposition...
    // fix with the following if and don't care
    if(!input.value.endsWith('.')){
      send({a:4,d:input.value.trim()})
      send({a:5})
    }
  }


  if(event.inputType === 'deleteContentBackward'){
    // delete either last character or full word
    // maybe best just to replace the full word
    send({a:4,d:input.value.trim()})
    return
  }


})

const append = obj => {
  const char = createChar(obj)
  char.innerText = obj.d

  let lastUserWord = getLastUserWord(obj.i)

  if(!lastUserWord || lastUserWord.classList.contains('end')){
    lastUserWord = createWord(obj)
    chat.appendChild(lastUserWord)
  }

  lastUserWord.appendChild(char)
  lastUserWord.scrollIntoView()
}

const replace = obj => {
  // it's either a deletion, backspace or autocompletion
  // in all cases switch out the whole last word from user
  const lastUserWord = getLastUserWord(obj.i)

  if(lastUserWord){
    // creates a char span but use the full word as innerText
    if(!obj.d.length){
      lastUserWord.remove()
    }else{
      const chars = createChar(obj)
      lastUserWord.innerHTML = createChar(obj).outerHTML
    }
  }else{
    const word = createWord(obj)
    const chars = createChar(obj)
    word.appendChild(chars)
    chat.appendChild(word)
  }
}

const endWord = obj => {
  const lastUserWord = getLastUserWord(obj.i)

  if(lastUserWord)
    lastUserWord.classList.add('end')
}

const createWord = obj => {
  const word = document.createElement('div')
  word.style.textDecorationColor = obj.c
  word.classList.add('word', obj.o ? 'own' : 'other')
  word.classList.add(`user-${obj.i}`)
  return word
}

const createChar = obj => {
  const char = document.createElement('span')
  char.classList.add('char')
  char.innerText = obj.d
  return char
}

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
  setTimeout(_=>input.value = '', 0)
  keyboard && keyboard.clearInput()
}

const heart = obj => {
  const div = document.createElement('div')
  div.innerText = '💙'
  div.className = 'heart'
  div.style.textShadow = `0 0 0 ${obj.c}`
  div.style.right = `${Math.floor(Math.random()*30)}px`
  div.style.transform = `rotate(${(Math.random() - 0.5) * 2*40}deg)`
  div.onanimationend = e => e.target.remove()
  // cannot append it to chat
  // because there is a bug
  // hearts won't show up after some time
  // flex box and absolte item weird behavior...
  app.appendChild(div)
}

//const display = obj => {
//
//  const msg = document.createElement('div')
//
//  msg.style.textDecorationColor = obj.c
//  msg.classList.add('msg', obj.o ? 'own' : 'other')
//  msg.classList.add(`user-${obj.i}`)
//
//  if(obj.d === ' ')
//    msg.classList.add(`space`)
//
//
//  msg.innerText = obj.d
//
//  //if(lastMsgElement && lastMsgElement.className !== msg.className)
//    //  lastMsgElement.style.paddingRight = '15px'
//
//  chat.appendChild(msg)
//
//  lastMsgElement = msg
//
//  msg.scrollIntoView()
//
//  // kind of a problem. the cleanup won't happen
//  // if chat keeps on receiving messages
//  // shit ugly as hell
//  clearTimeout(chatCleanUp)
//
//  chatCleanUp = setTimeout(_=> {
//    document.querySelector('#chat').innerHTML = ''
//  }, 8000)
//}

const getLastUserWord = user => {
  const words = document.querySelectorAll(`.word.user-${user}`)
  return words[words.length - 1]
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
  console.log('sending',obj)
  ws.send(JSON.stringify(obj))
}

connect()
input.focus()
