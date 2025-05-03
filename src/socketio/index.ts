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
  let auth = {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJpYXQiOjE3NDU5OTU5MzYsImV4cCI6MTc0NjA4MjMzNiwiYXVkIjoiaHR0cHM6Ly95b3VyZG9tYWluLmNvbSIsInN1YiI6IjEiLCJqdGkiOiI2ZWNiMDJiZC1hMGRlLTQyOGUtOTY4OC1hZmUzOTFhYmUxZTEifQ.Cs7Xv7nlY_DdGEN-adgUhPouwzImGH10jRg5K4clars",
    "strategy": "jwt",
    // "authentication": {
    //   "strategy": "local",
    //   "payload": {
    //     "iat": 1745995936,
    //     "exp": 1746082336,
    //     "aud": "https://yourdomain.com",
    //     "sub": "1",
    //     "jti": "6ecb02bd-a0de-428e-9688-afe391abe1e1"
    //   }
    // },
    // "user": {
    //   "id": 1,
    //   "createdAt": "2025-04-30T06:52:03.149Z",
    //   "updatedAt": "2025-04-30T06:52:03.149Z",
    //   "username": "1",
    //   "email": "1",
    //   "password": "$2b$10$gVfIaJyDH.Fqbn5.fnOKSuNpfKSfjV.61ER/Top/kVqyByh/kmqFy",
    //   "companyid": null,
    //   "appName": null
    // }
  }
  socket.feathers = {
    provider: 'socketio',
    headers: socket.handshake.headers,
    authentication: {
      strategy: 'jwt',
      accessToken:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJpYXQiOjE3NDYxMDQ5MTYsImV4cCI6MTc0NjE5MTMxNiwiYXVkIjoiaHR0cHM6Ly95b3VyZG9tYWluLmNvbSIsInN1YiI6IjEiLCJqdGkiOiI5NzVjOTgyOS0yOGQ4LTQ3MjYtYmI1MS0zZWNkOGRhMzZkZjcifQ.1drrn2sSIzBR4gLJq5ox83kkXdogoxaXuk5UaMOhhTM'
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
