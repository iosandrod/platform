// import {
//   createContext,
//   getServiceOptions,
//   HookContext,
//   Params,
//   RealTimeConnection
// } from '@feathersjs/feathers'
// import { FeathersSocket } from '@feathersjs/socketio/lib/middleware'
// import http from 'http'
// import { Server, ServerOptions, Socket } from 'socket.io'
// import { createDebug } from '@feathersjs/commons'
// import { CombinedChannel } from '@feathersjs/transport-commons'
// // import { DEFAULT_PARAMS_POSITION, normalizeError, paramsPositions, } from '@feathersjs/transport-commons/src/socket/utils'
// import { disconnect, params, authentication } from '@feathersjs/socketio/lib/middleware'
// import { SocketOptions, socket as socketMiddleware } from '@feathersjs/transport-commons/lib/socket'
// import isEqual from 'lodash/isEqual'
// import { BadRequest, MethodNotAllowed, NotFound } from '@feathersjs/errors'
// import { Application } from '@feathersjs/koa'
// import { reject } from 'lodash'
// import { routing } from '../../socketio/routing/index' //
// import { channels } from '../../channels/channels/index' //
// // console.log(getDispatcher, runMethod)
// export function appSocketio(port?: any, options?: any, config?: any) {
//   if (typeof port !== 'number') {
//     config = options
//     options = port
//     port = null 
//   }
//   if (typeof options !== 'object') {
//     config = options
//     options = {}
//   } //
//   return (app: Application) => {
//     let getParams = (socket: FeathersSocket) => socket.feathers
//     let socketMap = new WeakMap<RealTimeConnection, FeathersSocket>()
//     let done = new Promise(resolve => {
//       let { listen, setup } = app as any
//       //这里只是装饰了一下
//       Object.assign(app, {
//         async listen(this: any, ...args: any[]) {
//           if (typeof listen === 'function') {
//             // If `listen` already exists
//             // usually the case when the app has been expressified
//             return listen.call(this, ...args)
//           }
//           let server = http.createServer()
//           await this.setup(server)
//           return server.listen(...args)
//         },

//         async setup(this: any, server: http.Server, ...rest: any[]) {
//           if (server == null) {
//             return
//           }
//           //@ts-ignore
//           let mainApp: Application = app.mainApp //
//           let _io = mainApp.io
//           if (_io) {
//             let namespace = options.namespace
//             let io = _io.of(namespace)
//             io.use(disconnect(app, getParams, socketMap))
//             io.use(params(app, socketMap))
//             io.use(authentication(app, getParams))
//             // io.sockets.setMaxListeners(64)
//             this.io = io
//           }

//           resolve(this.io)
//           return setup.call(this, server, ...rest)
//         }
//       })
//     })
//     //@ts-ignore
//     //
//     // 再次立即执行//
//     app.configure(
//       socket({
//         done,
//         socketMap,
//         //@ts-ignore
//         getParams,
//         emit: 'emit' //
//       })
//     )
//   }
// }
// export function socket({ done, emit, socketMap, socketKey, getParams }: any) {
//   return (app: Application) => {
//     let leaveChannels = (connection: RealTimeConnection) => {
//       let { channels } = app

//       if (channels.length) {
//         app.channel(app.channels).leave(connection)
//       }
//     }
//     app.configure(channels()) //
//     // console.log(channels, 'testChannel') //
//     console.log(app.channel, 'testChannel') //
//     app.configure(routing())
//     app.on('publish', getDispatcher(emit, socketMap, socketKey))
//     app.on('disconnect', leaveChannels)
//     app.on('logout', (_authResult: any, params: Params) => {
//       let { connection } = params

//       if (connection) {
//         leaveChannels(connection)
//       }
//     }) //
//     // `connection` event
//     //@ts-ignore
//     done.then(provider => {
//       provider.on('connection', (connection: any) => app.emit('connection', getParams(connection)))
//     })
//     //@ts-ignore
//     done.then(provider =>
//       provider.on('connection', (connection: Socket) => {
//         let methodHandlers = Object.keys(app.services).reduce((result, name: any) => {
//           let { methods } = getServiceOptions(app.service(name))
//           //@ts-ignore
//           methods.forEach(method => {
//             if (!result[method]) {
//               result[method] = (...args: any[]) => {
//                 let [path, ...rest] = args
//                 let _rest = [...args]
//                 let last = _rest.slice(-1)[0]
//                 //@ts-ignore
//                 runMethod(app, getParams(connection), path, method, rest)
//               }
//             }
//           })
//           return result
//         }, {} as any)
//         Object.keys(methodHandlers).forEach(key => {
//           // console.log(connection, 'testConnect')//
//           connection.on(key, (...args: any[]) => {
//             methodHandlers[key](...args)
//           })
//         })
//       })
//     )
//   }
// }

// export function getDispatcher(emit: string, socketMap: WeakMap<RealTimeConnection, any>, socketKey?: any) {
//   return function (event: string, channel: CombinedChannel, context: HookContext, data?: any) {
//     channel.connections.forEach(connection => {
//       // The reference between connection and socket is set in `app.setup`
//       let socket = socketKey ? connection[socketKey] : socketMap.get(connection)

//       if (socket) {
//         let eventName = `${context.path || ''} ${event}`.trim()

//         let result = channel.dataFor(connection) || context.dispatch || context.result

//         // If we are getting events from an array but try to dispatch individual data
//         // try to get the individual item to dispatch from the correct index.
//         if (!Array.isArray(data) && Array.isArray(context.result) && Array.isArray(result)) {
//           result = result.find(resultData => isEqual(resultData, data))
//         }

//         socket[emit](eventName, result)
//       }
//     })
//   }
// }
// export function normalizeError(e: any) {
//   let hasToJSON = typeof e.toJSON === 'function'
//   let result = hasToJSON ? e.toJSON() : {}

//   if (!hasToJSON) {
//     Object.getOwnPropertyNames(e).forEach(key => {
//       result[key] = e[key]
//     })
//   }

//   if (process.env.NODE_ENV === 'production') {
//     delete result.stack
//   }
//   delete result.hook
//   return result
// }

// export let paramsPositions: { [key: string]: number } = {
//   find: 0,
//   update: 2,
//   patch: 2
// }
// export let DEFAULT_PARAMS_POSITION = 1
// export async function runMethod(
//   app: Application,
//   connection: RealTimeConnection,
//   _path: string,
//   _method: string,
//   args: any[]
// ) {
//   let path = typeof _path === 'string' ? _path : null
//   //@ts-ignore
//   let method: string = typeof _method === 'string' ? _method : null
//   let trace = `method '${method}' on service '${path}'`
//   let methodArgs = args.slice(0)
//   let callback =
//     // eslint-disable-next-line @typescript-eslint/no-empty-function
//     typeof methodArgs[methodArgs.length - 1] === 'function' ? methodArgs.pop() : function () {}

//   let handleError = (error: any) => {
//     callback(normalizeError(error))
//   }
//   try {
//     //@ts-ignore
//     let lookup = app.lookup(path)
//     // No valid service was found throw a NotFound error
//     if (lookup === null) {
//       throw new NotFound(path === null ? `Invalid service path` : `Service '${path}' not found`)
//     }
//     // console.log('我执行到这里')//
//     let { service, params: route = {} } = lookup
//     let { methods } = getServiceOptions(service)
//     // Only service methods are allowed
//     //@ts-ignore
//     if (!methods.includes(method)) {
//       throw new MethodNotAllowed(`Method '${method}' not allowed on service '${path}'`)
//     }
//     let position = paramsPositions[method] !== undefined ? paramsPositions[method] : DEFAULT_PARAMS_POSITION
//     let query = Object.assign({}, methodArgs[position])
//     // `params` have to be re-mapped to the query and added with the route
//     let params = Object.assign({ query, route, connection }, connection)
//     // `params` is always the last parameter. Error if we got more arguments.
//     if (methodArgs.length > position + 1) {
//       throw new BadRequest(`Too many arguments for '${method}' method`)
//     }
//     methodArgs[position] = params
//     //@ts-ignore
//     let ctx = createContext(service, method)
//     //@ts-ignore
//     let returnedCtx: HookContext = await (service as any)[method](...methodArgs, ctx)
//     let result = returnedCtx.dispatch || returnedCtx.result
//     result = {
//       data: result,
//       code: 200
//     }
//     callback(null, result)
//   } catch (error) {
//     handleError(error)
//   }
// }
