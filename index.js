import Koa from 'koa'
import Router from '@koa/router'
import views from 'koa-views'
import serve from 'koa-static'
import bodyParser from 'koa-bodyparser'
import { WebSocketServer } from 'ws'
import { parse } from 'url'

const app = new Koa()
const router = new Router()

router.get('/', async ctx => {
  await ctx.render('chat.pug')
})

router.get('/:room', async ctx => {
  await ctx.render('chat.pug')
})

const wss = new WebSocketServer({port: 3035})

wss.on('connection', (ws, req) => {

  const query = parse(req.url, true).query
  ws.room = query.room || 'main'

  ws.color = randomColor()

  const roomCast = msg => {
    for(const client of wss.clients){
      if(client.room === ws.room)
        client.send(JSON.stringify({
          ...msg,
          o: client === ws ? 1 : 0,
        }))
    }
  }

  const getRoomSize = _ => {
    let count = 0
    for(const client of wss.clients){
      if(client.room === ws.room)
        count++
    }
    return count
  }

  if(getRoomSize() === 1){
    let v = 600
    const c = randomColor();
    `🤖 Welcome to new way of texting. To send love just tap the spacebar.`
    .split(' ').forEach((msg, i, arr) => {
      setTimeout(_=> {
        ws.send(JSON.stringify({a: 1, d: msg, c}))
        if(i === arr.length-1){
          setTimeout(_=>ws.send(JSON.stringify({a:3,c})), 500)
          setTimeout(_=>ws.send(JSON.stringify({a:3,c})), 800)
          setTimeout(_=>ws.send(JSON.stringify({a:3,c})), 1000)
          setTimeout(_=>ws.send(JSON.stringify({a:3,c})), 1300)
        }

      }, v=v+140+(100*msg.length)+ (i===9?1500:0))

    })
  }

  console.log(`new connection in room ${ws.room}`)

  roomCast({
    a: 2,
    d: getRoomSize(),
    c: ws.color
  })

  ws.on('message', data =>  {

    if(!data.length)
      return

    let obj

    try{
      obj = JSON.parse(data)
    }catch(e){
      console.log(e)
      return
    }


    console.log(data+'')

    switch(obj.a){
      case 1:
        // msg
        roomCast({
          // send a heart if message empty, spacebar was pressed
          // otherwise send the message
          a: obj.d !== '' ? 1 : 3,
          d: obj.d,
          c: ws.color
        })
      break;
      case 3:
        // these hearts come from chat onclicks
        roomCast({
          a: 3,
          c: ws.color
        })
      break;
    }

  })

  ws.on('close', e =>  {
    console.log(`closed connection from ${ws.room}`)
    roomCast({
      a: 2,
      d: getRoomSize(),
    })
  })
})

const randomColor = (_ => {
  const randomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  return _ => {
    var h = randomInt(0, 360)
    var s = randomInt(42, 98)
    var l = randomInt(40, 65)
    return `hsl(${h},${s}%,${l}%)`
  }
})()


app.use(bodyParser())
app.use(serve('public'))
app.use(views('views'))
app.use(router.routes())
//app.listen(3034, '127.0.0.1')
app.listen(3034)
