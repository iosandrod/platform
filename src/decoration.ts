import {
  ApplicationHookMap,
  ApplicationHookOptions,
  defaultServiceMethods,
  HookOptions
} from '@feathersjs/feathers'
import { AsyncContextFunction, debug, HookFunction } from 'feathers-hooks-common'
import { stringToFunction } from './utils'
import { HookContext, NextFunction } from '@feathersjs/feathers'
import { authenticate } from '@feathersjs/authentication'
import { Application } from '@feathersjs/koa'
import { isAsyncFunction, isPromise } from 'util/types'
import { AuthenticateHookSettings } from '@feathersjs/authentication/lib/hooks/authenticate'
import { errors, NotAuthenticated } from '@feathersjs/errors'
import { myAuth } from './auth'
import { BaseService } from './services/base.service'
import { myFeathers } from './feather'
function getData(obj: any, key: string, defaultValue?: any) {
  let _value = obj[key]
  if (_value == null) {
    obj[key] = defaultValue
    _value = defaultValue
  }
  return _value
}
//这是ts的装饰器
export type routeConfig = {
  hook?: any[] //
  path?: string
  event?: string[] //
}
export type tranformConfig = {
  method: string
  fn?: any
}
export function useRoute(config: routeConfig = {}) {
  //@ts-ignore
  return function (target, propertyKey, descriptor) {
    let routes = target.routes
    if (routes == null) {
      target.routes = []
      routes = target.routes
    }
    let route: routeConfig = { ...config, path: propertyKey }
    routes.push(route) //
    return descriptor
  }
}
export function useGlobalRoute(config: routeConfig = {}) {
  //@ts-ignore
  return function (target, propertyKey, descriptor) {
    let routes = target._routes
    if (routes == null) {
      target._routes = []
      routes = target._routes //
    }
    let route: routeConfig = { ...config, path: config?.path || propertyKey }
    routes.push(route)

    return descriptor
  }
}
export const _authenticate = (
  originalSettings: string | AuthenticateHookSettings,
  ...originalStrategies: string[]
) => {
  const settings =
    typeof originalSettings === 'string'
      ? { strategies: [originalSettings, ...originalStrategies] }
      : originalSettings
  //@ts-ignore
  if (!originalSettings || settings.strategies.length === 0) {
    throw new Error('The authenticate hook needs at least one allowed strategy')
  }

  return async (context: HookContext, _next?: NextFunction) => {
    const next = typeof _next === 'function' ? _next : async () => context
    const { app, params, type, path, service } = context
    const { strategies } = settings
    const { provider, authentication } = params
    //@ts-ignore
    const authService: myAuth = app.defaultAuthentication(settings.service)
    if (provider != null && authentication == null) {
    }
    debug(`Running authenticate hook on '${path}'`)

    if (type && type !== 'before' && type !== 'around') {
      throw new NotAuthenticated('The authenticate hook must be used as a before hook')
    }

    if (!authService || typeof authService.authenticate !== 'function') {
      throw new NotAuthenticated('Could not find a valid authentication service')
    }

    if (service === authService) {
      throw new NotAuthenticated(
        'The authenticate hook does not need to be used on the authentication service'
      )
    }

    if (params.authenticated === true) {
      return next()
    }
    if (authentication) {
      const { provider, authentication, ...authParams } = params
      //@ts-ignore
      debug('Authenticating with', authentication, strategies)
      //@ts-ignore
      const authResult = await authService.authenticate(authentication, authParams, ...strategies)
      const { accessToken, ...authResultWithoutToken } = authResult
      context.params = {
        ...params,
        ...authResultWithoutToken,
        authenticated: true
      } //
    } else if (provider) {
      throw new NotAuthenticated('Not authenticated')
    }
    return next()
  }
}

//使用校验规则
export function useValidate(config: any) {}
export type useAuthConfig = {}
export function useAuthenticate(config?: useAuthConfig) {
  //@ts-ignore
  return function (target, propertyKey, descriptor) {
    let _target = target
    let hooksMetaData = _target.hooksMetaData
    if (hooksMetaData == null || !Array.isArray(hooksMetaData)) {
      _target.hooksMetaData = []
      hooksMetaData = _target.hooksMetaData
    }
    let _config: HookOptions<any, any> = {
      [propertyKey]: [_authenticate('jwt')] ////
    }
    hooksMetaData.push(_config) //
    return descriptor
  }
}
export function useGlobalAuthenticate(config?: useAuthConfig) {
  //@ts-ignore
  return function (target, propertyKey, descriptor) {
    let _target = target
    let hooksMetaData = _target._hooksMetaData
    if (hooksMetaData == null || !Array.isArray(hooksMetaData)) {
      _target._hooksMetaData = []
      hooksMetaData = _target._hooksMetaData
    }
    let _config: HookOptions<any, any> = {
      [propertyKey]: [_authenticate('jwt')] ////
    }
    hooksMetaData.push(_config) //
    return descriptor
  }
}
export function useUnAuthenticate() {
  //@ts-ignore
  return function (target, propertyKey, descriptor) {
    let _target = target
    let unAuthMethods = getData(_target, 'unAuthMethods', [])
    unAuthMethods.push(propertyKey) //
    return descriptor
  }
}

export type methodTransform = {
  [key: string]: AsyncContextFunction<any, any>
}
export function useMethodTransform(config: methodTransform, methodName?: any) {
  return function (target: any, propertyKey: any, descriptor: any) {
    if (config == null || typeof config != 'object') {
      return descriptor
    }
    let _value: any[] = getData(target, 'hooksMetaData', [])
    let _key = methodName
    if (_key == null) {
      _key = propertyKey
    }
    _value.push({
      //@ts-ignore
      [_key]: [
        //@ts-ignore
        async function (context, next) {
          for (const [key, value] of Object.entries(config)) {
            let data = context.data
            if (Array.isArray(data)) {
              let _data = data
              for (const data of _data) {
                let oldValue = data[key]
                if (typeof value !== 'function') {
                  await next() //
                }
                //@ts-ignore
                let _value1 = await value(oldValue, data, context)
                if (_value1 == null) {
                  continue
                }
                data[key] = _value1 //
              }
            } else {
              let oldValue = data[key]
              if (typeof value !== 'function') {
                await next() //
              }
              //@ts-ignore
              let _value1 = await value(oldValue, data, context)
              if (_value1 == null) {
                continue
              }
              data[key] = _value1 //
            }
          }
          await next()
        }
      ]
    })
    return descriptor
  }
}

export function useHook(config: HookOptions<any, any>, fn?: any) {
  //类装饰器
  return function RunOnInstance(OriginalClass: any) {
    function NewConstructor(...args: any[]) {
      const instance = new OriginalClass(...args)
      let _value: any[] = getData(instance, 'hooksMetaData', [])
      if (fn) {
      }
      // console.log(config)
      if (typeof config !== 'object') {
        return instance //
      }
      if (_value.findIndex(v => v === config) !== -1) {
      } else {
        _value.push(config) //
      }
      if (fn) {
        fn(instance) //
      }
      return instance
    }
    // 拷贝原型，以保留原有方法
    NewConstructor.prototype = OriginalClass.prototype
    // 保持类型不报错（可选）//
    return NewConstructor as any
  }
}

export function cacheValue(config?: Function) {
  let cacheReturnValue = function cacheReturnValue(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    if (isAsyncFunction(originalMethod)) {
      descriptor.value = async function (...args: any[]) {
        //@ts-ignore
        let cache = this.cache //
        let id = args[0] || ''
        let _key = `${propertyKey}--${id}` //
        if (typeof config === 'function') {
          let _key1 = await config.apply(this, args)
          if (typeof _key1 === 'string') {
            _key = _key1
            _key = `${propertyKey}--${_key}` //
          }
        }
        let _value = cache[_key]
        if (_value != null) {
          //
          return _value //
        }
        let result = await originalMethod.apply(this, args) //
        if (isPromise(result)) {
          result = await result
        }
        cache[_key] = result //
        return result //
      }
    } else {
      descriptor.value = function (...args: any[]) {
        //@ts-ignore
        let cache = this.cache //
        let id = args[0] || '' //
        let _key = `${propertyKey}--${id}`
        if (typeof config === 'function') {
          let _key1 = config.apply(this, args) //
          if (typeof _key1 === 'string') {
            _key = _key1
            _key = `${propertyKey}--${_key}`
          }
        }
        let _value = cache[_key]
        if (_value != null) {
          return _value //
        }
        let result = originalMethod.apply(this, args) //
        cache[_key] = result ////
        return result //
      } //
    }
  }
  return cacheReturnValue
}
export function cacheRedisValue(config?: Function) {
  let cacheReturnValue = function cacheReturnValue(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    if (isAsyncFunction(originalMethod)) {
      descriptor.value = async function (...args: any[]) {
        let _this: BaseService = this as any
        let redisClient = _this.getRedisClient()
        //@ts-ignore
        let id = args[0] || ''
        let _key = `${propertyKey}--${id}` //
        if (typeof config === 'function') {
          let _key1 = await config.apply(this, args)
          if (typeof _key1 === 'string') {
            _key = _key1
            _key = `${propertyKey}--${_key}`
          }
        }
        let _value = await redisClient.get(_key)
        if (_value != null) {
          //
          return _value //
        }
        let result = await originalMethod.apply(this, args) //
        if (isPromise(result)) {
          result = await result
        }
        await redisClient.set(_key, result) //
        return result //
      }
    } else {
    }
  }
  return cacheReturnValue
}

export function useTranslate(config: any) {}

export function cacheFindValue(config?: Function) {
  let _cacheFn = function () {}
}

//使用验证码功能
export function useCaptCha(config: any) {
  return function (target: any, propertyKey: any, descriptor: any) {
    if (config == null || typeof config != 'object') {
      return descriptor
    }
    let _value: any[] = getData(target, 'hooksMetaData', [])
    _value.push({
      //
      //@ts-ignore
      [propertyKey]: [
        //@ts-ignore
        async function (context, next) {
          let data = context.data
          let _captcha: string = data['_captcha'] //
          let _unUse = data['_unUseCaptcha']
          if (_unUse == true) {
            await next()
          } else {
            let params = context?.params
            let headers = params?.headers
            if (headers == null) {
              await next()
              return
            } //
            let service = context.service
            let app: myFeathers = service.app //
            let host = headers.host //
            let sName = service.serviceName //
            let _key = `${sName}_${propertyKey}` //
            let cText: string = app.getApiCaptcha(host, _key, true) //
            if (cText == null || _captcha == null) {
              throw new errors.BadRequest('验证码校验失败')
            } //
            cText = cText.toLocaleLowerCase()
            _captcha = _captcha.toLocaleLowerCase() //
            if (cText != _captcha) {
              throw new errors.BadRequest('验证码校验失败') //
            }
            app.clearApiCaptcha(host, _key) //
            await next()
          }
        }
      ]
    })
    return descriptor
  }
}
