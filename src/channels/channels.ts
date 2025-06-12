// For more information about this file see https://dove.feathersjs.com/guides/cli/channels.html
import type { RealTimeConnection, Params } from '@feathersjs/feathers'
import type { AuthenticationResult } from '@feathersjs/authentication'
// import { keys } from '@feathersjs/transport-commons/src/channels/mixins'
import type { Application, HookContext } from '../declarations'
import { logger } from '../utils/logger'
// const PUBLISHERS = Symbol.for('@feathersjs/transport-commons/publishers')
// const CHANNELS = Symbol.for('@feathersjs/transport-commons/channels')
// const ALL_EVENTS = Symbol.for('@feathersjs/transport-commons/all-events')

// export const keys = {
//   PUBLISHERS: PUBLISHERS as typeof PUBLISHERS,
//   CHANNELS: CHANNELS as typeof CHANNELS,
//   ALL_EVENTS: ALL_EVENTS as typeof ALL_EVENTS
// }
// console.log(keys,'sfsfsfs')//
export const channels = (app: Application) => {
  logger.warn(
    'Publishing all events to all authenticated users. See `channels.ts` and https://dove.feathersjs.com/api/channels.html for more information.'
  )
  app.on('connection', (connection: RealTimeConnection) => {
    // On a new real-time connection, add it to the anonymous channel
    app.channel('anonymous').join(connection)
    app.channel('all').join(connection)
  })
  app.on('login', (authResult: AuthenticationResult, { connection }: Params) => {
    if (connection) {
      app.channel('anonymous').leave(connection)
      app.channel('authenticated').join(connection) //
    }
  })
  app.publish((data: any, context: HookContext) => {
    //所有消息都发送到这里来了
    return [app.channel('all'), app.channel('authenticated')] //
  })
}
