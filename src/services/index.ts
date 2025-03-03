// For more information about this file see https://dove.feathersjs.com/guides/cli/application.html#configure-functions
import { KnexAdapterOptions } from '@feathersjs/knex'
import type { Application, HookContext, NextFunction } from '../declarations'
import { CompanyService } from './company.service'
import { defaultServiceMethods } from '@feathersjs/feathers'
import _ from 'lodash'
import { FeathersKoaContext } from '@feathersjs/koa'
import { AppService } from './app.service'
import { UsersService } from './users.service'
export const services = (app: Application) => {
  // All services will be registered here
  let names = Object.keys(createMap) //
  let allServices = names.map((name: any) => {
    let obj = { path: name, service: createServices(name, null, app) }
    return obj
  })
  for (const obj of allServices) {
    const p: string = obj.path //装饰
    const service = obj.service
    let routes = service.routes || [] //
    let routesMethods = routes.map(route => route.path)
    // let methods = [...defaultServiceMethods, ...routesMethods]
    // console.log(methods, 'testMethods')//
    //@ts-ignore
    let ts = app.use(p, service, {
      methods: [...defaultServiceMethods, ...routesMethods], // //
      koa: {
        before: [
          async (context: FeathersKoaContext, next: NextFunction) => {
            await next()
          }
        ]
      }
    })
    //
    ts.hooks({
      around: {
        all: [
          async (context: HookContext, next) => {
            await next()
          }
        ] //
      }
    })
  }
}
export const mergeServiceOptions = (options1: KnexAdapterOptions, options2: KnexAdapterOptions) => { }
//构建service实例
export const createServices = (serverName: keyof typeof createMap, options: any, app: Application) => {
  let createClass = createMap[serverName]
  let _options: KnexAdapterOptions = options || {}
  const methods = defaultServiceMethods //
  let Model = app.get('postgresqlClient')
  _.merge(_options, {
    methods, name: serverName, Model,
    // schema: serverName 
  } as KnexAdapterOptions) //
  let service = new createClass(_options) //
  //@ts-ignore
  let routes = service.routes
  // if (Array.isArray(routes) && routes.length > 0) {
  // }
  return service
}

const createMap = {
  company: CompanyService,
  app: AppService,
  users: UsersService
}
