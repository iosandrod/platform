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
import { myFeathers } from '../../feather'
import BaseService from './base.service'
import EntityService from '../../services/entity.service'
import CaptchaService from '../../services/captcha.service'
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
  permissions: PermissinoService,
  entity: EntityService,
  captcha: CaptchaService//
}

export const services = async (app: Application, mainApp: myFeathers) => {
  let names = Object.keys(createMap) //
  let _names = await mainApp.getCompanyTable()
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
    service.initHooks(app)
  }
}

export const createServices = (serverName: keyof typeof createMap, options: any, app: Application) => {
  let createClass = createMap[serverName]
  let _createClass = createClass //
  if (createClass == null) {
    createClass = BaseService //
  }
  let _options: KnexAdapterOptions = options || {}
  const methods = defaultServiceMethods //
  let Model = app.get('postgresqlClient') //
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
