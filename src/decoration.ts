//这是ts的装饰器
export type routeConfig = {
  hook?: any[] //
  path?: string
  event?: string[] //
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
