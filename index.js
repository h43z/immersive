import Koa from 'koa'
import Router from '@koa/router'
import views from 'koa-views'
import serve from 'koa-static'
import bodyParser from 'koa-bodyparser'
import { WebSocketServer } from 'ws'


const app = new Koa()
const router = new Router()

router.get('/', async ctx => {
  await ctx.render('chat.pug')
})

const wss = new WebSocketServer({port: 3035})

wss.on('connection', ws => {

  ws.color = randomColor()

  ws.on('message', data =>  {
    for(const client of wss.clients){
      client.send(JSON.stringify({
        msg: data+'',
        own: client === ws, 
        color: ws.color
      }))
    }
  })
})


const randomColor = (_ => {
  const randomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  return _ => {
    var h = randomInt(0, 360)
    var s = randomInt(42, 98)
    var l = randomInt(40, 90)
    return `hsl(${h},${s}%,${l}%)`
  }
})()


app.use(bodyParser())
app.use(serve('public'))
app.use(views('views'))
app.use(router.routes())
app.listen(3034)//, '127.0.0.1')
