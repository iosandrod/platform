import { Application, defaultServiceMethods, HookContext, NextFunction } from '@feathersjs/feathers'
import { UsersService } from './users.service'
import { RolePermission } from '../../entity/role_permission.entity'
import { PermissinoService } from './permissions.service'
import { RoleService } from './roles.service'
import { KnexAdapterOptions } from '@feathersjs/knex'
import _ from 'lodash'//
import { FeathersKoaContext } from '@feathersjs/koa'

const createMap = {
    users: UsersService,
    roles: RoleService,
    permissions: PermissinoService
}

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


export const createServices = (serverName: keyof typeof createMap, options: any, app: Application) => {
    let createClass = createMap[serverName]
    let _options: KnexAdapterOptions = options || {}
    const methods = defaultServiceMethods //
    let Model = app.get('postgresqlClient')//
    _.merge(_options, {
        methods, name: serverName, Model,
    } as KnexAdapterOptions) //
    let service = new createClass(_options) //
    //@ts-ignore
    // let routes = service.routes
    return service
}

