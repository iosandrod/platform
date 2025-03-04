// For more information about this file see https://dove.feathersjs.com/guides/cli/application.html
import { feathers, HookContext } from '@feathersjs/feathers'
import 'reflect-metadata'
import { koa, rest, bodyParser, errorHandler, parseAuthentication, cors, serveStatic } from '@feathersjs/koa'
import socketio from '@feathersjs/socketio'
import { services } from './services/index'
import { configurationValidator } from './configuration'
import type { Application, serviceMap } from './declarations'
import { logError } from './hooks/log-error'
import { postgresql } from './postgresql'
// import { services } from './services/index'
import { channels } from './channels/channels'
import { configuration } from './config'
import { createFeathers } from './feather'
import { BaseService } from './services/base.service'
export function createApp() {
  const f = createFeathers()
  //@ts-ignore
  const app: Application = koa(f) //
  app.configure(configuration)
  app.use(cors())
  app.use(serveStatic(app.get('public')))
  app.use(errorHandler())
  app.use(parseAuthentication())
  app.use(bodyParser()) //
  app.configure(rest())
  //处理用户认证的事情//
  app.configure(
    socketio({
      cors: {
        origin: app.get('origins')
      }
    })
  )
  app.configure(postgresql)
  app.configure(services)
  app.configure(channels)
  app.hooks({
    around: {
      all: [logError]
    },
    before: {},
    after: {},
    error: {}
  })
  // Register application setup and teardown hooks here
  app.hooks({
    setup: [
      async (context: HookContext, next: any) => {
        //构建所有子应用
        await next() //
      },
      //@ts-ignore
      async (context: HookContext, next: any) => {
        const app = context.app
        const postgresqlClient = app.get('postgresqlClient')
        const services = app.services as serviceMap
        const cService = app.service('company')
        const allServices = Object.values(services)
        for (const service of allServices) {
          //@ts-ignore
          await service.setup(app) //
        }
      }
    ],
    teardown: []
  })
  return app
}
