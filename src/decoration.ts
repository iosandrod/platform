import { defaultServiceMethods } from "@feathersjs/feathers"
import { HookFunction } from "feathers-hooks-common"
import { hooks } from '@feathersjs/hooks'
import { stringToFunction } from "./utils"
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

export function useTransformHooks(config: tranformConfig) {
  // console.log(config, 'testConfig')//
  return function (target: any) {//
    let newConstruction = function (...args: any[]) {
      let obj = new target(...args)
      let method = config.method
      let routes = obj.routes
      let hasRoute = routes.map((rou: any) => rou.path).includes(method)
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