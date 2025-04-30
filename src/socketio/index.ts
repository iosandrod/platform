import { Application, Params, RealTimeConnection } from '@feathersjs/feathers'
import { createDebug } from '@feathersjs/commons'
import { Socket } from 'socket.io'
import { Server, ServerOptions } from 'socket.io'
import http from 'http'
import { socket } from '@feathersjs/transport-commons'
export type ParamsGetter = (socket: Socket) => any
export type NextFunction = (err?: any) => void
export interface FeathersSocket extends Socket {
  feathers?: Params & { [key: string]: any }
}
export const disconnect = (
  app: Application,
  getParams: ParamsGetter,
  socketMap: WeakMap<RealTimeConnection, FeathersSocket>
) => {
  app.on('disconnect', (connection: RealTimeConnection) => {
    const socket = socketMap.get(connection)
    if (socket && socket.connected) {
      socket.disconnect()
    }
  })

  return (socket: FeathersSocket, next: NextFunction) => {
    socket.on('disconnect', () => app.emit('disconnect', getParams(socket)))
    next()
  }
}

export const params = (_app: Application, socketMap: WeakMap<RealTimeConnection, FeathersSocket>) => (
  socket: FeathersSocket,
  next: NextFunction
) => {
  socket.feathers = {
    provider: 'socketio',
    headers: socket.handshake.headers,
    authentication: {
      strategy: 'jwt',
      accessToken:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJpYXQiOjE3NDU5OTE4MzMsImV4cCI6MTc0NjA3ODIzMywiYXVkIjoiaHR0cHM6Ly95b3VyZG9tYWluLmNvbSIsInN1YiI6IjEiLCJqdGkiOiIzZDM5NjY0Yi02Y2YzLTRhODQtOWQ0Mi1kMmU1Y2Y0NjU0ZmEifQ.-2z-4MX5kMY295uonIPejL-4B63c4BNTJLcAX1rqusQ'
    }
  }
  //   console.log(socket.feathers, 'testFeathers') //
  socketMap.set(socket.feathers, socket)
  next()
}

export const authentication = (app: Application, getParams: ParamsGetter, settings: any = {}) => (
  socket: FeathersSocket,
  next: NextFunction
) => {
  const service = (app as any).defaultAuthentication
    ? (app as any).defaultAuthentication(settings.service)
    : null

  if (service === null) {
    return next()
  }
  const config = service.configuration
  const authStrategies = config.parseStrategies || config.authStrategies || []

  if (authStrategies.length === 0) {
    return next()
  }
  //   console.log(
  //     // socket.feathers,
  //     authStrategies
  //   ) // //
  service
    .parse(socket.handshake, null, ...authStrategies)
    .then(async (authentication: any) => {
      if (authentication) {
        //@ts-ignore
        socket.feathers.authentication = authentication
        await service.create(authentication, {
          provider: 'socketio',
          connection: getParams(socket)
        })
      }

      next()
    })
    .catch(next)
}

export function configureSocketio(port?: any, options?: any, config?: any) {
  if (typeof port !== 'number') {
    config = options
    options = port
    port = null
  }

  if (typeof options !== 'object') {
    config = options
    options = {}
  }

  return (app: Application) => {
    // Function that gets the connection
    const getParams: any = (socket: FeathersSocket) => socket.feathers
    // A mapping from connection to socket instance
    const socketMap = new WeakMap<RealTimeConnection, FeathersSocket>()
    // Promise that resolves with the Socket.io `io` instance
    // when `setup` has been called (with a server)
    const done = new Promise(resolve => {
      const { listen, setup } = app as any

      Object.assign(app, {
        async listen(this: any, ...args: any[]) {
          if (typeof listen === 'function') {
            // If `listen` already exists
            // usually the case when the app has been expressified
            return listen.call(this, ...args)
          }

          const server = http.createServer()

          await this.setup(server)

          return server.listen(...args)
        },

        async setup(this: any, server: http.Server, ...rest: any[]) {
          if (!this.io) {
            const io = (this.io = new Server(port || server, options))

            io.use(disconnect(app, getParams, socketMap))
            io.use(params(app, socketMap))
            io.use(authentication(app, getParams))
            io.sockets.setMaxListeners(64)
          }

          if (typeof config === 'function') {
            config.call(this, this.io)
          }

          resolve(this.io)

          return setup.call(this, server, ...rest)
        }
      })
    })

    app.configure(
      socket({
        done,
        socketMap,
        getParams,
        emit: 'emit'
      })
    )
  }
}
