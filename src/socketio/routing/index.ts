import { Application, FeathersService, ServiceOptions } from '@feathersjs/feathers'
import { Router } from './router'
import { myFeathers } from '@/feather'

declare module '@feathersjs/feathers/lib/declarations' {
  interface RouteLookup {
    service: Service
    params: { [key: string]: any }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Application<Services, Settings> {
    // eslint-disable-line
    //@ts-ignore
    routes: Router<{
      service: Service
      params?: { [key: string]: any }
    }>
    lookup(path: string): RouteLookup
  }
}

export * from './router'

const lookup = function (this: Application, path: string) {
  const result: any = this.routes.lookup(path)
  if (result === null) {
    let _this: myFeathers = this as any
    let main = this
    let ps = path.split('/').filter((p: any) => p != '') //
    let tableName = ps[0]
    let isSubApp = Object.values(_this.subApp)
      .map((item: any) => item.get('prefix'))
      .includes(ps[0])
    if (isSubApp) {
      let subApp = Object.values(_this.subApp).find((item: any) => item.get('prefix') === ps[0])
      _this = subApp as any
      tableName = ps[1]
    }
    console.log('是子应用') //
    let allTableName = _this.getAllTableName()
    if (!allTableName.includes(tableName)) return null //
    let allT = _this.getStaticCompanyTable()
    let addOpt = _this.getAddOptions(tableName, allT)
    // console.log(tableName, 'testTableName') //
    let s = _this.addService({ options: addOpt, serviceName: tableName })
    if (s) {
      //@ts-ignore
      let _res = _this.routes.lookup(path)
      if (isSubApp) {
        _res = main.routes.lookup(path) ////
      }
      //@ts-ignore
      if (_res) {
        // console.log(_res, 'test_res') //
        // console.log(_res.service, 'res.service') //
        let {
          params: colonParams,
          data: { service, params: dataParams }
        } = _res

        let params = dataParams ? { ...dataParams, ...colonParams } : colonParams
        // return _res //
        return { service, params } //
      }
    }
    //@ts-ignore
    return null
  }

  const {
    params: colonParams,
    data: { service, params: dataParams }
  } = result

  const params = dataParams ? { ...dataParams, ...colonParams } : colonParams
  return { service, params }
}

export const routing = () => (app: any) => {
  if (typeof app.lookup === 'function') {
    return
  }

  const { unuse } = app as any

  app.routes = new Router()
  app.lookup = lookup
  app.unuse = function (path: string) {
    app.routes.remove(path)
    app.routes.remove(`${path}/:__id`)
    return unuse.call(this, path)
  }

  // Add a mixin that registers a service on the router
  app.mixins.push((service: FeathersService, path: string, options: ServiceOptions) => {
    const { routeParams: params = {} } = options

    app.routes.insert(path, { service, params })
    app.routes.insert(`${path}/:__id`, { service, params })
  })
}
