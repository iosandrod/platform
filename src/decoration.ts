import {
  ApplicationHookMap,
  ApplicationHookOptions,
  defaultServiceMethods,
  HookOptions
} from '@feathersjs/feathers'
import { AsyncContextFunction, HookFunction } from 'feathers-hooks-common'
import { stringToFunction } from './utils'
import { hooks } from '@feathersjs/hooks'
import { authenticate } from '@feathersjs/authentication'
import { Application } from '@feathersjs/koa'
import { isAsyncFunction, isPromise } from 'util/types'
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
    const route: routeConfig = { ...config, path: propertyKey }
    routes.push(route) //
    return descriptor
  }
}

//使用校验规则
export function useValidate(config: any) {}
export type useAuthConfig = {}
export function useAuthenticate(config?: useAuthConfig) {
  //
  //方法装饰器
  //@ts-ignore
  return function (target, propertyKey, descriptor) {
    let _target = target
    let hooksMetaData = _target.hooksMetaData
    // let routes = _target.routes || []
    if (hooksMetaData == null || !Array.isArray(hooksMetaData)) {
      _target.hooksMetaData = []
      hooksMetaData = _target.hooksMetaData
    }
    let _config: HookOptions<any, any> = {
      [propertyKey]: [authenticate('jwt')] //
    }
    hooksMetaData.push(_config) //
    return descriptor
  }
}

export type methodTransform = {
  [key: string]: AsyncContextFunction<any, any>
}
export function useMethodTransform(config: methodTransform) {
  return function (target: any, propertyKey: any, descriptor: any) {
    if (config == null || typeof config != 'object') {
      return descriptor
    }
    let _value: any[] = getData(target, 'hooksMetaData', [])
    _value.push({
      //@ts-ignore
      [propertyKey]: [
        //@ts-ignore
        async function (context, next) {
          for (const [key, value] of Object.entries(config)) {
            let data = context.data
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
          await next()
        }
      ]
    })
    return descriptor
  }
}

export function useHook(config: HookOptions<any, any>) {
  //类装饰器
  return function RunOnInstance(OriginalClass: any) {
    function NewConstructor(...args: any[]) {
      const instance = new OriginalClass(...args)
      let _value: any[] = getData(instance, 'hooksMetaData', [])
      if (typeof config !== 'object') {
        return instance //
      }
      _value.push(config) //
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
        let id = args[0]
        let _key = `${propertyKey}--${id}`
        if (typeof config === 'function') {
          let _key1 = await config.apply(this, args)
          if (typeof _key1 === 'string') {
            _key = _key1
          }
        }
        let _value = cache[_key]
        if (_value != null) {
          //
          return _value //
        }
        let result = originalMethod.apply(this, args)
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
        let id = args[0]
        let _key = `${propertyKey}--${id}`
        if (typeof config === 'function') {
          let _key1 = config.apply(this, args) //
          if (typeof _key1 === 'string') {
            _key = _key1
          }
        }
        let _value = cache[_key]
        if (_value != null) {
          return _value //
        }
        let result = originalMethod.apply(this, args)
        cache[_key] = result ////
        return result //
      } //
    }
  }
  return cacheReturnValue
}
