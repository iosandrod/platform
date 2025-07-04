// For more information about this file see https://dove.feathersjs.com/guides/cli/channels.html
import type { RealTimeConnection, Params } from '@feathersjs/feathers'
import type { AuthenticationResult } from '@feathersjs/authentication'
// import { keys } from '@feathersjs/transport-commons/src/channels/mixins'
import type { Application, HookContext } from '../declarations'
import { logger } from '../utils/logger'
export const channels = (app: any) => {
  logger.warn(
    'Publishing all events to all authenticated users. See `channels.ts` and https://dove.feathersjs.com/api/channels.html for more information.'
  )
  app.on('connection', (connection: RealTimeConnection) => {
    // console.log('some one is join', connection) //
    const socketMap = app.get('socketMap')
    if (socketMap) {
      let client = socketMap.get(connection)
      let user = client?.feathers?.user
      if (user) {
        if (client) {
          client.emit('connected login', user) //
        }
      }
      // console.log(Object.keys(client), 'testAuth') //
    }
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
