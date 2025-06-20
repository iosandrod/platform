import { Application, feathers } from '@feathersjs/feathers'
import configuration from '@feathersjs/configuration'
import { configurationValidator } from './app_config/index'
import { appPostgresql } from './db/app_postgresql'
import { services } from './app_service'
// import { routing } from '@feathersjs/transport-commons'
import { appAuthenticate } from './app_auth/app_authenticate'
// import { appSocketio } from './socketio/app_socketio' //
import { koa } from '@feathersjs/koa'
import { createFeathers, myFeathers } from '../feather'
import { routing } from '../socketio/routing/index'
import { configureSocketio } from '../socketio/index' //
export const createApp = async (mainApp: myFeathers, config: any) => {
  const app1 = createFeathers() //
  let companyId = config.userid //
  const app = app1
  //@ts-ignore
  app.mainApp = mainApp //
  app.set('appName', 'erp') //
  app.set('companyid', companyId) //公司ID就是用户ID
  app.configure(configuration(configurationValidator))
  app.configure(routing()) //设置路由和认证相关的////
  //前台需要知道用户的角色和ID才可以进行操作
  // app.configure(appPostgresql) //设置数据库
  // appPostgresql(app, config)
  await app.initKnexClient(config)
  await app.initTableService() //
  // await services(app, mainApp) //
  // app.configure(services) //设置服务
  app.configure(appAuthenticate) //设置认证
  //@ts-ignore
  // app.configure(
  //   //@ts-ignore//
  //   appSocketio({
  //     namespace: `erp_${companyId}`, //
  //     origin: app.get('origins')
  //   })
  // ) //
  let fn = configureSocketio({ cors: { origin: app.get('origins') }, namespace: `erp_${companyId}` })
  await fn(app) //
  return app
}
