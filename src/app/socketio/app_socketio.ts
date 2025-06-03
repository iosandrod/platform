import {
  createContext,
  getServiceOptions,
  HookContext,
  Params,
  RealTimeConnection
} from '@feathersjs/feathers'
import { FeathersSocket } from '@feathersjs/socketio/lib/middleware'
import http from 'http'
import { Server, ServerOptions, Socket } from 'socket.io'
import { createDebug } from '@feathersjs/commons'
import { channels, CombinedChannel, routing } from '@feathersjs/transport-commons'
// import { DEFAULT_PARAMS_POSITION, normalizeError, paramsPositions, } from '@feathersjs/transport-commons/src/socket/utils'
import { disconnect, params, authentication } from '@feathersjs/socketio/lib/middleware'
import { SocketOptions, socket as socketMiddleware } from '@feathersjs/transport-commons/lib/socket'
import isEqual from 'lodash/isEqual'
import { BadRequest, MethodNotAllowed, NotFound } from '@feathersjs/errors'
import { Application } from '@feathersjs/koa'
import { reject } from 'lodash'
// console.log(getDispatcher, runMethod)
export function appSocketio(port?: any, options?: any, config?: any) {
  if (typeof port !== 'number') {
    config = options
    options = port
    port = null
  }
  if (typeof options !== 'object') {
    config = options
    options = {}
  } //
  return (app: Application) => {
    const getParams = (socket: FeathersSocket) => socket.feathers
    const socketMap = new WeakMap<RealTimeConnection, FeathersSocket>()
    const done = new Promise(resolve => {
      const { listen, setup } = app as any
      //这里只是装饰了一下
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
          if (server == null) {
            return
          }
          //@ts-ignore
          let mainApp: Application = app.mainApp //
          let _io = mainApp.io
          if (_io) {
            let namespace = options.namespace
            let io = _io.of(namespace)
            io.use(disconnect(app, getParams, socketMap))
            io.use(params(app, socketMap))
            io.use(authentication(app, getParams))
            // io.sockets.setMaxListeners(64)
            this.io = io
          }
          // if (this.io) {
          //   resolve(this.io)
          // } else {
          //   reject('找不到父级IO实例')
          // }
          resolve(this.io)
          return setup.call(this, server, ...rest)
        }
      })
    })
    //@ts-ignore
    //
    // 再次立即执行//
    app.configure(
      socket({
        done,
        socketMap,
        //@ts-ignore
        getParams,
        emit: 'emit' //
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
