import { ApplicationHookMap, ApplicationHookOptions, defaultServiceMethods, HookOptions } from "@feathersjs/feathers"
import { AsyncContextFunction, HookFunction } from "feathers-hooks-common"
import { stringToFunction } from "./utils"
import { hooks } from '@feathersjs/hooks'
import { authenticate } from '@feathersjs/authentication'
import { Application } from "@feathersjs/koa"
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
  method: string,
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
export function useValidate(config: any) {

}
export type useAuthConfig = {}
export function useAuthenticate(config?: useAuthConfig) {//
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
      [propertyKey]: [authenticate('jwt')]//
    }
    hooksMetaData.push(_config)//
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
      [propertyKey]: [async function (context, next) {
        for (const [key, value] of Object.entries(config)) {
          let data = context.data
          let oldValue = data[key]
          if (typeof value !== 'function') {
            await next()//
          }
          //@ts-ignore
          let _value1 = await value(oldValue, data, context)
          if (_value1 == null) {
            continue
          }
          data[key] = _value1//
        }
        await next()
      }]
    })
    return descriptor
  }
}


export function useTransformHooks(config: tranformConfig) {
  // console.log(config, 'testConfig')//
  return function (target: any) {//
    let newConstruction = function (...args: any[]) {
      let obj = new target(...args)
      let method = config.method
      let routes = obj.routes
      let hasRoute = routes?.map((rou: any) => rou.path)?.includes(method)
      if (!hasRoute && !defaultServiceMethods.includes(method)) {
        return obj
      }
      let fn = config.fn
      if (!Array.isArray(fn)) {
        fn = [fn]
      }
      let _fn = fn.map((f: any) => {
        if (typeof f == 'string') {
          let _fn1 = stringToFunction(f)
          return _fn1
        }
        if (typeof f == 'function') {
          return f
        }
      }).filter((f: any) => f != null)
      hooks(obj, {
        [method]: _fn//
      })
      //@ts-ignore
      return obj
    }//
    newConstruction.prototype = target.prototype
    return newConstruction as any
  }
}