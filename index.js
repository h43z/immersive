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

  console.log(`new connection in room ${ws.room}`)

  roomCast({
    a: 2,
    d: getRoomSize(),
  })

  ws.on('message', data =>  {
    if(!data.length)
      return

    console.log(data+'')

    roomCast({
      a: 1,
      d: data+'',
      c: ws.color
    })
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
app.listen(3034)//, '127.0.0.1')
