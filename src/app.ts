// For more information about this file see https://dove.feathersjs.com/guides/cli/application.html
import { feathers, HookContext } from '@feathersjs/feathers'
import 'reflect-metadata'
import { bodyParser, errorHandler, parseAuthentication, cors, serveStatic } from '@feathersjs/koa'
import { rest } from './rest'
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
import featherBlob from 'feathers-blob'
import { configureSocketio } from './socketio'
import { koa } from './koa'
import dotenv from 'dotenv'
dotenv.config() //
import pg from 'pg'
import moment from 'moment-timezone'
import { Knex } from 'knex'
pg.types.setTypeParser(1184, (val: any) => moment.tz(val, 'Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss'))

// 可选：也处理 timestamp without time zone
pg.types.setTypeParser(1114, (val: any) => moment.tz(val, 'Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss'))
declare module './declarations' {
  interface Configuration {
    postgresqlClient: Knex
  }
}
// export let appArr = [
//   {
//     companyid: '1',
//     name: 'erp',
//     companyId: 1,

//     appName: 'erp',
//     userid: 1
//   }
// ] //
export async function createApp() {
  let f = createFeathers()
  //@ts-ignore
  let app: Application = koa(f)
  app.configure(configuration)
  app.use(cors())
  app.use(serveStatic(app.get('public')))
  app.use(errorHandler())
  app.use(parseAuthentication())
  app.use(bodyParser()) //
  app.configure(rest())
  await redis(app) //
  
  let fn = configureSocketio({ cors: { origin: app.get('origins') } })
  await fn(app) //
  await app.initKnexClient(app.get('postgresql')) //
  await app.initTableService() //
  await app.initAuth() //
  app.configure(channels)
  //设置用户认证
  // app.configure(mainAuth) //
  app.hooks({
    around: {
      all: [logError]
    },
    before: {},
    after: {},
    error: {}
  })
  let allCompany = await app.getAllCompany()
  // let client = app.get('postgresqlClient')
  // let allCompany: any[] = []
  let company = allCompany.map((c: any) => {
    let uid = c.userid
    let appName = c.appName
    let connection = c.connection
    return {
      userid: uid,
      appName: appName,
      connection
    }
  })
  // console.log(company, 'testCompany') //
  for (const sApp of company) {
    // console.log(sApp, 'testCompany')//
    // //@ts-ignore
    await app.registerSubApp(sApp)
  }
  // Register application setup and teardown hooks here
  app.hooks({
    setup: [
      //@ts-ignore
      async (context: HookContext, next: any) => {
        //@ts-ignore
        let app: myFeathers = context.app
        let services = app.services as serviceMap
        // let cService = app.service('company')
        let allServices = Object.values(services)
        for (const service of allServices) {
          if (typeof service.init !== 'function') continue
          //@ts-ignore
          await service.init(app) //
        }
        let subApp = app.subApp
        let allSubApp = Object.entries(subApp)
        for (const [key, sApp] of allSubApp) {
          let services = sApp.services as serviceMap
          let allServices = Object.values(services)
          for (const service of allServices) {
            if (typeof service.init !== 'function') continue
            //@ts-ignore
            await service.init(sApp) //
          }
        }
        await next() //
      }
    ],
    teardown: []
  }) //
  return app
}
