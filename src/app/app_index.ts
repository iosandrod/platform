import { Application, feathers } from '@feathersjs/feathers'
import configuration from '@feathersjs/configuration'
// import { routing } from '@feathersjs/transport-commons'
// import { appSocketio } from './socketio/app_socketio' //
import { koa } from '@feathersjs/koa'
import { createFeathers, myFeathers } from '../feather'
import { configureSocketio } from '../socketio/index' //
export const createApp = async (mainApp: myFeathers, config: any) => {
  const app1 = createFeathers() //
  let companyId = config.userid //
  const app = app1
  //@ts-ignore
  app.mainApp = mainApp //
  app.set('appName', 'erp') //
  app.set('companyid', companyId) //公司ID就是用户ID
  // app.configure(configuration()) //
  await app.initDefaultConfig() //
  // app.configure(routing()) //设置路由和认证相关的
  await app.initRouteClass() //
  //前台需要知道用户的角色和ID才可以进行操作
  await app.initKnexClient(config)
  await app.initTableService() //
  await app.initAuth() //
  // app.configure(appAuthenticate) //设置认证
  let fn = configureSocketio({ cors: { origin: app.get('origins') }, namespace: `erp_${companyId}` })
  await fn(app) //
  return app
}
