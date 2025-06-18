import compose from 'koa-compose'
import { http } from '@feathersjs/transport-commons'
import { createDebug } from '@feathersjs/commons'
import { getServiceOptions, defaultServiceMethods, createContext } from '@feathersjs/feathers'
import { MethodNotAllowed } from '@feathersjs/errors'

import { Application } from './declarations'
type Middleware = any
const debug = createDebug('@feathersjs/koa/rest')
export function parseAuthentication(settings: any = {}): Middleware {
    return async (ctx: any, next: any) => {
        const app = ctx.app
        const service = app.defaultAuthentication?.(settings.service)
        if (!service) {
            return next()
        }
        const config = service.configuration
        const authStrategies = settings.strategies || config.parseStrategies || config.authStrategies || []

        if (authStrategies.length === 0) {
            debug('No `authStrategies` or `parseStrategies` found in authentication configuration')
            return next()
        }
        
        const authentication = await service.parse(ctx.req, ctx.res, ...authStrategies)
        // console.log(authentication,'testAuth')//
        if (authentication) {
            debug('Parsed authentication from HTTP header', authentication)
            ctx.feathers = { ...ctx.feathers, authentication }
        }
        return next()
    }
}
const serviceMiddleware = (): Middleware => {
    return async (ctx: any, next: any) => {
        let { query, headers, path, body: data, method: httpMethod } = ctx.request
        let tMethod = path.split('/').pop()//
        //如果不是数字

        if(!Number.isNaN(parseInt(tMethod))){
            tMethod==null
        } 
        let { service, params: { __id: id = null, ...route } = {} } = ctx.lookup!
        let serviceName = service.serviceName
        let methodOverride: any = ctx.request.headers[http.METHOD_HEADER] as string | undefined
        if(serviceName!=null&&serviceName!=tMethod&&tMethod!=null){
            methodOverride=methodOverride||tMethod//            
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        let method = http.getServiceMethod(httpMethod, id, methodOverride)
        // console.log(method, httpMethod, methodOverride, 'testMethods')////
        let _obj = getServiceOptions(service)
        // let { methods } = getServiceOptions(service)
        let methods: any = _obj.methods
        // debug(`Found service for path ${path}, attempting to run '${method}' service method`)
        if (!methods.includes(method) || defaultServiceMethods.includes(methodOverride)) {
            const error = new MethodNotAllowed(`Method \`${method}\` is not supported by this endpoint.`)
            ctx.response.status = error.code
            throw error
        }
        const createArguments = http.argumentsFor[method as 'get'] || http.argumentsFor.default
        const params = { query, headers, route, ...ctx.feathers }
        let args = createArguments({ id, data, params })
        let contextBase = createContext(service, method, { http: {} })
        ctx.hook = contextBase
        const context = await (service as any)[method](...args, contextBase)
        ctx.hook = context
        const response = http.getResponse(context)
        ctx.status = response.status
        ctx.set(response.headers)
        ctx.body = response.body
        return next()
    }
}

const servicesMiddleware = (): Middleware => {
    return async (ctx: any, next: any) => {
        const app = ctx.app
        const lookup = app.lookup(ctx.request.path)
        if (!lookup) {
            return next()
        }
        ctx.lookup = lookup
        const options: any = getServiceOptions(lookup.service)
        const middleware = options.koa.composed
        return middleware(ctx, next)
    }
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const formatter: Middleware = (_ctx: any, _next: any) => { }

export type RestOptions = {
    formatter?: Middleware
    authentication?: any
}

export const rest = (options?: RestOptions | Middleware) => {
    options = typeof options === 'function' ? { formatter: options } : options || {}
    let formatterMiddleware = options.formatter || formatter
    let authenticationOptions = options.authentication
    return (app: Application) => {
        app.use(parseAuthentication(authenticationOptions))
        app.use(servicesMiddleware())
        app.mixins.push((_service, _path, options) => {
            const { koa: { before = [], after = [] } = {} } = options as any
            const middlewares = [].concat(before, serviceMiddleware(), after, formatterMiddleware)
            const middleware = compose(middlewares)
            options.koa ||= {}
            options.koa.composed = middleware
        })
    }
}
