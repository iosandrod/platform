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
import { createFeathers, myFeathers } from './feather'
import { BaseService } from './services/base.service'
import { mainAuth } from './auth'
import { redis } from './redis'
export const appArr = [
  {
    companyid: '1',
    name: 'erp'
  }
]
export async function createApp() {
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
  await redis(app) //
  //处理用户认证的事情//
  app.configure(
    socketio({
      cors: {
        origin: app.get('origins')
      }
    })
  )
  await app.configure(postgresql) ////
  await services(app) //
  app.configure(channels)
  //设置用户认证
  app.configure(mainAuth) //
  app.hooks({
    around: {
      all: [logError]
    },
    before: {},
    after: {},
    error: {}
  })
  const allCompany = await app.getAllCompany()
  // console.log(allCompany,'testCompany')//
  for (const sApp of appArr) {
    //@ts-ignore
    await app.registerSubApp(sApp.name, sApp.companyid)
  }
  // Register application setup and teardown hooks here
  app.hooks({
    setup: [
      //@ts-ignore
      async (context: HookContext, next: any) => {
        //@ts-ignore
        const app: myFeathers = context.app
        // const postgresqlClient = app.get('postgresqlClient')
        const services = app.services as serviceMap
        // const cService = app.service('company')
        const allServices = Object.values(services)
        for (const service of allServices) {
          if (typeof service.init !== 'function') continue
          //@ts-ignore
          await service.init(app) //
        }
        // const subApp = app.subApp
        // const allSubApp = Object.entries(subApp)
        // for (const [key, sApp] of allSubApp) {
        //   const services = sApp.services as serviceMap
        //   const allServices = Object.values(services)
        //   for (const service of allServices) {
        //     if (typeof service.init !== 'function') continue
        //     //@ts-ignore
        //     await service.init(sApp) //
        //   }
        // }
        await next() //
      }
    ],
    teardown: []
  })
  app.hooks({
    all: [
      async (context: HookContext, next: any) => {
        await next()
        let params = context.params || {}
        let provider = params.provider
        if (provider == 'socketio') {
          ////
          context.result = {
            data: context.result,
            code: 200
          } //
        }
      }
    ]
  })
  return app
}
