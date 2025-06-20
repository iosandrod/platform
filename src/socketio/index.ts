import { Application, Params, RealTimeConnection, SERVICE, ServiceOptions } from '@feathersjs/feathers'
import { createDebug } from '@feathersjs/commons'
import { Socket } from 'socket.io'
import { Server, ServerOptions } from 'socket.io'
import http from 'http'
import { SocketOptions } from '@feathersjs/transport-commons/lib/socket'
// import { routing } from '@feathersjs/transport-commons'
import { createContext, HookContext } from '@feathersjs/feathers'
import { CombinedChannel } from '@feathersjs/transport-commons'
// import { DEFAULT_PARAMS_POSITION, normalizeError, paramsPositions, } from '@feathersjs/transport-commons/src/socket/utils'
import { socket as socketMiddleware } from '@feathersjs/transport-commons/lib/socket'
import isEqual from 'lodash/isEqual'
import { BadRequest, MethodNotAllowed, NotFound } from '@feathersjs/errors'
// import { socket } from '@feathersjs/transport-commons'
import { channels } from './channels'
import { routing } from './routing'
import { myFeathers } from '@/feather'
export type ParamsGetter = (socket: Socket) => any
export type NextFunction = (err?: any) => void
export interface FeathersSocket extends Socket {
  feathers?: Params & { [key: string]: any }
}
export function getServiceOptions(service: any): ServiceOptions {
  return service[SERVICE]
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
  if (socket?.handshake?.auth?.authorization) {
    socket.handshake.headers['authorization'] = socket?.handshake?.auth?.authorization //
  }
  socket.feathers = {
    provider: 'socketio',
    headers: socket.handshake.headers
  }
  //@ts-ignore
  socketMap.set(socket.feathers, socket)
  next()
}

export const authentication = (app: Application, getParams: ParamsGetter, settings: any = {}) => {
  return async (socket: FeathersSocket, next: NextFunction) => {
    const service = (app as any).defaultAuthentication
      ? (app as any).defaultAuthentication(settings.service)
      : null
    // console.log('几十块雷锋精神到了咖啡机双打卡理发手打啦',service)
    if (service === null) {
      return next()
    }
    const config = service.configuration
    const authStrategies = config.parseStrategies || config.authStrategies || []

    if (authStrategies.length === 0) {
      return next()
    } //
    service
      .parse(socket.handshake, null, ...authStrategies)
      .then(async (authentication: any) => {
        // console.log(authentication, 'sklslkfsfsfs') //
        if (authentication) {
          //@ts-ignore
          socket.feathers.authentication = authentication
          // console.log(authentication, 'testEn2131231') //
          await service.create(authentication, {
            provider: 'socketio',
            connection: getParams(socket)
          })
        }

        next()
      })
      .catch((err: any) => {
        console.log(err?.message, '登录出错了') //
        next()
      })
  }
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

  return (_app: Application) => {
    let app: myFeathers | any = _app as any
    // Function that gets the connection
    const getParams: any = (socket: FeathersSocket) => {
      return socket.feathers
    }
    // A mapping from connection to socket instance
    let socketMap = new WeakMap<RealTimeConnection, FeathersSocket>()
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
          let app1: myFeathers = app
          let isMain = app1.getIsMain()
          if (isMain == false) {
            let mainApp: Application = app1.mainApp as any
            let _io = mainApp.io
            if (_io) {
              let namespace = options.namespace
              if (namespace == null) {
                console.log('namespace is null',options)//
                throw new Error('namespace is null') //
              }
              let io = _io.of(namespace)
              io.use(disconnect(app, getParams, socketMap))
              io.use(params(app, socketMap))
              io.use(authentication(app, getParams))
              // io.sockets.setMaxListeners(64)
              this.io = io
            }

            resolve(this.io)
            return setup.call(this, server, ...rest)
          }
          if (server == null) {
            return
          }
          if (!this.io) {
            const io = (this.io = new Server(port || server, options))
            let oldEmit = io.emit
            //@ts-ignore
            // console.log('运行到这里放松放松电风扇收到')
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
    app.set('socketMap', socketMap) //
    app.configure(
      //
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
    app.configure(channels()) //
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
        let allS = app.services
        let methodHandlers = Object.keys(app.services).reduce((result, name: any) => {
          //
          // console.log(app.service(name))//
          let { methods } = getServiceOptions(app.service(name))
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
  const throttleMap = new Map<
    string,
    {
      timer: NodeJS.Timeout | null
      sockets: Set<any>
      data: any
    }
  >()

  const changeEvents = ['patched', 'created', 'updated', 'removed']

  // 节流触发器
  function throttleEmit(eventName: string, data: any, connections: RealTimeConnection[]) {
    let throttle = throttleMap.get(eventName)
    if (!throttle) {
      throttle = {
        timer: null,
        sockets: new Set(),
        data: null
      }
      throttleMap.set(eventName, throttle)
    }

    // 收集所有相关 socket
    for (const connection of connections) {
      const socket = socketKey ? connection[socketKey] : socketMap.get(connection)
      if (socket) {
        throttle.sockets.add(socket)
      }
    }

    // 更新最新数据
    throttle.data = data

    if (!throttle.timer) {
      throttle.timer = setTimeout(() => {
        for (const socket of throttle!.sockets) {
          console.log(eventName, 'throttled emit')
          socket[emit](eventName, throttle!.data)
        }
        throttle!.timer = null
        throttle!.sockets.clear()
        throttle!.data = null
      }, 10)
    }
  }

  return function (event: string, channel: CombinedChannel, context: HookContext, data?: any) {
    const basePath = context.path || ''
    const rawEventName = `${basePath} ${event}`.trim()
    const changedEventName = `${basePath} changed`
    // console.log(rawEventName, basePath, 'testEventName') //
    const connections = channel.connections
    ////
    connections.forEach(connection => {
      const socket = socketKey ? connection[socketKey] : socketMap.get(connection)
      if (!socket) return
    })

    // 统一数据
    let result = channel.dataFor ? channel.dataFor(connections[0]) : context.dispatch || context.result
    if (!Array.isArray(data) && Array.isArray(context.result) && Array.isArray(result)) {
      result = result.find(item => isEqual(item, data))
    }

    // ✅ 1. 原事件节流
    throttleEmit(rawEventName, result, connections)

    // ✅ 2. 如果是变更类事件，再额外发 changed 事件
    if (changeEvents.includes(event)) {
      throttleEmit(changedEventName, result, connections)
    }
  }
} //

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
    // console.log('执行到这里了', path, 'testPath') // //
    //@ts-ignore
    let lookup = app.lookup(path)
    // console.log(lookup,'testLookup')//
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
