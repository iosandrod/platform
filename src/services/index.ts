// For more information about this file see https://dove.feathersjs.com/guides/cli/application.html#configure-functions
import { KnexAdapterOptions } from '@feathersjs/knex'
import type { Application, HookContext, NextFunction } from '../declarations'
import { CompanyService } from './company.service'
import { defaultServiceMethods } from '@feathersjs/feathers'
import _ from 'lodash'
import { FeathersKoaContext } from '@feathersjs/koa'
import { AppService } from './app.service'
import { UsersService } from './users.service'
import { hooks } from '@feathersjs/hooks' //
import * as fs from 'fs'
import * as path from 'path'
import { pathToFileURL } from 'url'
import EntityService from './entity.service'
import { myFeathers } from '../feather'
import { BaseService } from './base.service'
import NavService from './navs.service'
import FieldsService from './fields.service'
export const services = async (app: myFeathers) => {
  let names = Object.keys(createMap) //
  let _names = await app.getCompanyTable()
  let allT = _names
  _names = Object.keys(_names) ////
  names = [...names, ..._names] //
  names = names.filter((name, i) => names.indexOf(name) == i) //
  let arr = []
  for (const name of names) {
    let id = 'id'
    let ids = []
    let _t = allT[name]
    if (_t) {
      let primaryKey = _t.columns.filter((col: any) => col['is_primary_key'] == true)
      ids = primaryKey.map((col: any) => col['column_name'])
      if (ids.length > 0) {
        let _key = primaryKey[0]['column_name']
        id = _key
      } else {
        console.log('表格没有主键字段', name, ids) ////
      }
    }
    let opt = {
      id,
      ids
    }
    //@ts-ignore
    let s = await createServices(name, opt, app as any) //
    let obj = {
      path: name,
      service: s
    }
    arr.push(obj)
  }
  let allServices = arr //
  for (const obj of allServices) {
    const p: string = obj.path //装饰
    const service = obj.service
    //@ts-ignore
    let hooksMetaData = service.hooksMetaData
    if (hooksMetaData != null && Array.isArray(hooksMetaData)) {
      for (const hook of hooksMetaData) {
        hooks(service, hook)
      }
    }

    let routes = service.routes || [] //
    let routesMethods = routes.map(route => route.path)
    //@ts-ignore
    let ts = app.use(p, service, {
      //@ts-ignore
      methods: [...defaultServiceMethods, ...routesMethods], // //
      koa: {
        before: [
          async (context: FeathersKoaContext, next: NextFunction) => {
            await next()
          }
        ],
        after: [
          async (context: FeathersKoaContext, next: NextFunction) => {
            await next() ////
            const response = context.response
            response.body = {
              data: response.body,
              code: 200
            } //
          }
        ]
      }
    })
    ts.hooks({
      after: {
        //@ts-ignore
      }
    })
  }
}
//构建service实例
export const createServices = async (serverName: keyof typeof createMap, options: any, app: Application) => {
  let createClass = createMap[serverName]
  let _createClass = createClass
  if (createClass == null) {
    createClass = BaseService //
  }
  let _options: KnexAdapterOptions = options || {}
  const methods = defaultServiceMethods //
  let Model = app.get('postgresqlClient')
  _.merge(_options, {
    methods,
    name: serverName,
    Model
  } as KnexAdapterOptions) //
  let service = new createClass(_options) //
  if (_createClass == null) {
    //@ts-ignore
    service.serviceName = serverName
  } else {
    service.serviceName = serverName
  }
  //@ts-ignore
  return service
}

const createMap = {
  // fields: FieldsService,
  navs: NavService, //
  company: CompanyService,
  // app: AppService,
  users: UsersService,
  entity: EntityService
}
export async function importModulesFromFolder(directory: string) {
  const files = await fs.readdirSync(directory)
  const modules = [] as any
  for (const file of files) {
    let fileName = file.split('\\').pop()
    if (!/service/.test(fileName || '') || fileName === 'base.service.ts') {
      continue
    }
    const ext = path.extname(file)
    if (ext !== '.ts' && ext !== '.js') continue
    if (fileName == null) {
      continue
    }
    const module = await import(path.join(__dirname, fileName)) //
    let _default = module.default //
    if (_default == null) {
      continue
    }
    modules.push(_default) // 支持 default 导出
  }
  return modules
}
