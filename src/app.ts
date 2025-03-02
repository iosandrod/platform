// For more information about this file see https://dove.feathersjs.com/guides/cli/application.html
import { feathers, HookContext } from '@feathersjs/feathers'
// import configuration from '@feathersjs/configuration'
import { koa, rest, bodyParser, errorHandler, parseAuthentication, cors, serveStatic } from '@feathersjs/koa'
import socketio from '@feathersjs/socketio'
import { services } from './services/index'
import { configurationValidator } from './configuration'
import type { Application } from './declarations'
import { logError } from './hooks/log-error'
import { postgresql } from './postgresql'
// import { services } from './services/index'
import { channels } from './channels'
import { configuration } from './config'
export function createApp() {
  const app: Application = koa(feathers())
  app.configure(configuration)
  app.use(cors())
  app.use(serveStatic(app.get('public')))
  app.use(errorHandler())
  app.use(parseAuthentication())
  app.use(bodyParser())

  // Configure services and transports
  app.configure(rest())
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
  // Register hooks that run on all service methods
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
      async (context: HookContext) => {
        const app = context.app
        const postgresqlClient = app.get('postgresqlClient')
      }
    ],
    teardown: []
  })
  return app
}
