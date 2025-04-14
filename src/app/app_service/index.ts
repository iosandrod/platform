import { Application, defaultServiceMethods, HookContext, NextFunction } from '@feathersjs/feathers'
import { UsersService } from './users.service'
import { RolePermission } from '../../entity/role_permission.entity'
import { PermissinoService } from './permissions.service'
import { RoleService } from './roles.service'
import { KnexAdapterOptions } from '@feathersjs/knex'
import _ from 'lodash' //
import { FeathersKoaContext } from '@feathersjs/koa'
import { hooks } from '@feathersjs/hooks' //
import * as fs from 'fs'
import * as path from 'path'
import { pathToFileURL } from 'url'
export async function importModulesFromFolder(directory: string = __dirname, mainApp?: Application) {
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
const createMap = {
  users: UsersService,
  roles: RoleService,
  permissions: PermissinoService
}

export const services = async (app: Application, mainApp?: Application) => {
  let names = Object.keys(createMap) //
  // let _objects = await importModulesFromFolder(__dirname) //
  let postgresqlClient = app.get('postgresqlClient')
  if (postgresqlClient != null) {
  }
  let allServices = names.map((name: any) => {
    let obj = { path: name, service: createServices(name, null, app) }
    return obj
  })
  for (const obj of allServices) {
    const p: string = obj.path //装饰
    const service = obj.service
    let hooksMetaData = service.hooksMetaData
    if (hooksMetaData != null && Array.isArray(hooksMetaData)) {
      for (const hook of hooksMetaData) {
        hooks(service, hook)
      }
    }
    let routes = service.routes || [] //
    let routesMethods = routes.map(route => route.path) //
    //@ts-ignore
    let ts = app.use(p, service, {
      //@ts-ignore
      methods: [...defaultServiceMethods, ...routesMethods], // //
      koa: {
        before: [
          async (context: FeathersKoaContext, next: NextFunction) => {
            await next()
          }
        ]
      }
    })
    ts.hooks({
      around: {
        all: [
          async (context: HookContext, next) => {
            await next()
          }
        ]
      }
    })
  }
}

export const createServices = (serverName: keyof typeof createMap, options: any, app: Application) => {
  let createClass = createMap[serverName]
  let _options: KnexAdapterOptions = options || {}
  const methods = defaultServiceMethods //
  let Model = app.get('postgresqlClient') //
  _.merge(_options, {
    methods,
    name: serverName,
    Model
  } as KnexAdapterOptions) //
  let service = new createClass(_options) //
  //@ts-ignore
  // let routes = service.routes
  return service
}
