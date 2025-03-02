// For more information about this file see https://dove.feathersjs.com/guides/cli/application.html#configure-functions
import { KnexAdapterOptions } from '@feathersjs/knex'
import type { Application, NextFunction } from '../declarations'
import { CompanyService } from './company.service'
import { defaultServiceMethods } from '@feathersjs/feathers'
import _ from 'lodash'
import { FeathersKoaContext } from '@feathersjs/koa'
export const services = (app: Application) => {
  // All services will be registered here
  let names = Object.keys(createMap) //
  let allServices = names.map((name: any) => {
    let obj = { path: name, service: createServices(name, null, app) }
    return obj
  })
  for (const obj of allServices) {
    const p: string = obj.path
    //@ts-ignore
    let ts = app.use(p, obj.service, {
      methods: defaultServiceMethods, //
      koa: {
        before: [
          async (context: FeathersKoaContext, next: NextFunction) => {
            console.log('我执行到这里了')//

            
            await next()
          }
        ]
      }
    })
    //
    ts.hooks({
      around: {
        all: [] //
      }
    })
  }
}
export const mergeServiceOptions = (options1: KnexAdapterOptions, options2: KnexAdapterOptions) => {}
//构建service实例
export const createServices = (serverName: keyof typeof createMap, options: any, app: Application) => {
  let createClass = createMap[serverName]
  let _options: KnexAdapterOptions = options || {}
  const methods = defaultServiceMethods //
  let Model = app.get('postgresqlClient')
  _.merge(_options, { methods, name: serverName, Model } as KnexAdapterOptions) //
  let service = new createClass(_options) //
  return service
}

const createMap = {
  company: CompanyService
}
