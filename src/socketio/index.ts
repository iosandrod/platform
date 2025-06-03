import { Application, getServiceOptions, Params, RealTimeConnection } from '@feathersjs/feathers'
import { createDebug } from '@feathersjs/commons'
import { Socket } from 'socket.io'
import { Server, ServerOptions } from 'socket.io'
import http from 'http'
import { SocketOptions } from '@feathersjs/transport-commons/lib/socket'
import { channels, routing } from '@feathersjs/transport-commons'
import { createContext, HookContext } from '@feathersjs/feathers'
import { CombinedChannel } from '@feathersjs/transport-commons'
// import { DEFAULT_PARAMS_POSITION, normalizeError, paramsPositions, } from '@feathersjs/transport-commons/src/socket/utils'
import { socket as socketMiddleware } from '@feathersjs/transport-commons/lib/socket'
import isEqual from 'lodash/isEqual'
import { BadRequest, MethodNotAllowed, NotFound } from '@feathersjs/errors'
// import { socket } from '@feathersjs/transport-commons'
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
    //     "iat": 1745995936,//
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
        "eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJpYXQiOjE3NDYyNjM0MjAsImV4cCI6MTc0NjM0OTgyMCwiYXVkIjoiaHR0cHM6Ly95b3VyZG9tYWluLmNvbSIsInN1YiI6IjEiLCJqdGkiOiIxZjEzOTRhZi1hODA4LTQzMTAtYTM1OS1jNmJlNmJkYTU3Y2QifQ.QydhEx5Q3TX0rauXbb_QEB8puf0Tkse4W0Jopr81McE"
    }
  }
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
    options = {} //
  } ////

  return (app: Application) => {
    // Function that gets the connection
    const getParams: any = (socket: FeathersSocket) => socket.feathers
    // A mapping from connection to socket instance
    const socketMap = new WeakMap<RealTimeConnection, FeathersSocket>()
    // Promise that resolves with the Socket.io `io` instance
    // when `setup` has been called (with a server)
    const done = new Promise(resolve => {
      //
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
            let oldEmit = io.emit
            //@ts-ignore
            
            io.use(disconnect(app, getParams, socketMap))
            io.use(params(app, socketMap))
            io.use(authentication(app, getParams))
            io.use(async (socket, next) => {
              await next()
            })
            io.sockets.setMaxListeners(64)
          }

          if (typeof config === 'function') {
            config.call(this, this.io)
          } ////
          resolve(this.io)
          return setup.call(this, server, ...rest)
        }
      })
    })

    app.configure(//
      socket({
        done,
        socketMap,
        getParams,
        emit: 'emit'
      })
    )
  }
}
export function socket({ done, emit, socketMap, socketKey, getParams }: any) {
  return (app: Application) => {
    const leaveChannels = (connection: RealTimeConnection) => {
      const { channels } = app

      if (channels.length) {
        app.channel(app.channels).leave(connection)
      }
    }
    app.configure(channels())
    app.configure(routing())
    app.on('publish', getDispatcher(emit, socketMap, socketKey))
    app.on('disconnect', leaveChannels)
    app.on('logout', (_authResult: any, params: Params) => {
      const { connection } = params

      if (connection) {
        leaveChannels(connection)
      }
    })
    // `connection` event
    //@ts-ignore
    done.then(provider => {
      provider.on('connection', (connection: any) => app.emit('connection', getParams(connection)))
    })
    //@ts-ignore
    done.then(provider =>
      provider.on('connection', (connection: Socket) => {
        const methodHandlers = Object.keys(app.services).reduce((result, name: any) => {
          const { methods } = getServiceOptions(app.service(name))
          //@ts-ignore
          methods.forEach(method => {
            if (!result[method]) {
              result[method] = (...args: any[]) => {
                const [path, ...rest] = args
                let _rest = [...args]
                let last = _rest.slice(-1)[0]
                //@ts-ignore
                runMethod(app, getParams(connection), path, method, rest)
              }
            }
          })
          return result
        }, {} as any)
        Object.keys(methodHandlers).forEach(key => {
          // console.log(connection, 'testConnect')//
          connection.on(key, (...args: any[]) => {
            methodHandlers[key](...args)
          })
        })
      })
    )
  }
}

export function getDispatcher(emit: string, socketMap: WeakMap<RealTimeConnection, any>, socketKey?: any) {
  return function (event: string, channel: CombinedChannel, context: HookContext, data?: any) {
    channel.connections.forEach(connection => {
      // The reference between connection and socket is set in `app.setup`
      const socket = socketKey ? connection[socketKey] : socketMap.get(connection)

      if (socket) {
        const eventName = `${context.path || ''} ${event}`.trim()

        let result = channel.dataFor(connection) || context.dispatch || context.result

        // If we are getting events from an array but try to dispatch individual data
        // try to get the individual item to dispatch from the correct index.
        if (!Array.isArray(data) && Array.isArray(context.result) && Array.isArray(result)) {
          result = result.find(resultData => isEqual(resultData, data))
        }

        socket[emit](eventName, result)
      }
    })
  }
}
export function normalizeError(e: any) {
  const hasToJSON = typeof e.toJSON === 'function'
  const result = hasToJSON ? e.toJSON() : {}

  if (!hasToJSON) {
    Object.getOwnPropertyNames(e).forEach(key => {
      result[key] = e[key]
    })
  }

  if (process.env.NODE_ENV === 'production') {
    delete result.stack
  }
  delete result.hook
  return result
}

export const paramsPositions: { [key: string]: number } = {
  find: 0,
  update: 2,
  patch: 2
}
export const DEFAULT_PARAMS_POSITION = 1
export async function runMethod(
  app: Application,
  connection: RealTimeConnection,
  _path: string,
  _method: string,
  args: any[]
) {
  const path = typeof _path === 'string' ? _path : null
  //@ts-ignore
  const method: string = typeof _method === 'string' ? _method : null
  const trace = `method '${method}' on service '${path}'`
  const methodArgs = args.slice(0)
  const callback =
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    typeof methodArgs[methodArgs.length - 1] === 'function' ? methodArgs.pop() : function () {}

  const handleError = (error: any) => {
    callback(normalizeError(error))
  }
  try {
    //@ts-ignore
    const lookup = app.lookup(path)
    // No valid service was found throw a NotFound error
    if (lookup === null) {
      throw new NotFound(path === null ? `Invalid service path` : `Service '${path}' not found`)
    }
    // console.log('我执行到这里')//
    const { service, params: route = {} } = lookup
    const { methods } = getServiceOptions(service)
    // Only service methods are allowed
    //@ts-ignore
    if (!methods.includes(method)) {
      throw new MethodNotAllowed(`Method '${method}' not allowed on service '${path}'`)
    }
    const position = paramsPositions[method] !== undefined ? paramsPositions[method] : DEFAULT_PARAMS_POSITION
    const query = Object.assign({}, methodArgs[position])
    // `params` have to be re-mapped to the query and added with the route
    const params = Object.assign({ query, route, connection }, connection)
    // `params` is always the last parameter. Error if we got more arguments.
    if (methodArgs.length > position + 1) {
      throw new BadRequest(`Too many arguments for '${method}' method`)
    }
    methodArgs[position] = params
    //@ts-ignore
    const ctx = createContext(service, method)
    //@ts-ignore
    const returnedCtx: HookContext = await (service as any)[method](...methodArgs, ctx)
    let result = returnedCtx.dispatch || returnedCtx.result
    result = {
      data: result,
      code: 200
    }
    callback(null, result)
  } catch (error) {
    handleError(error)
  }
}
//
