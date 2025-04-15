import { Application, feathers } from '@feathersjs/feathers'
import configuration from '@feathersjs/configuration'
import { configurationValidator } from './app_config/index'
import { appPostgresql } from './db/app_postgresql'
import { services } from './app_service'
import { routing } from '@feathersjs/transport-commons'
import { appAuthenticate } from './app_auth/app_authenticate'
import { appSocketio } from './socketio/app_socketio' //
import { koa } from '@feathersjs/koa'
import { myFeathers } from '../feather'

export const createApp = async (mainApp: myFeathers, companyId: string) => {
  const app1 = feathers()
  const app = app1
  //@ts-ignore
  app.mainApp = mainApp //
  app.set('appName', 'erp') //
  app.set('companyid', companyId)
  app.configure(configuration(configurationValidator))
  app.configure(routing()) //设置路由和认证相关的//
  //前台需要知道用户的角色和ID才可以进行操作
  app.configure(appPostgresql) //设置数据库
  await services(app, mainApp)//
  // app.configure(services) //设置服务
  app.configure(appAuthenticate) //设置认证
  //@ts-ignore
  app.configure(
    //@ts-ignore//
    appSocketio({
      namespace: `erp_${companyId}`, //
      origin: app.get('origins')
    })
  ) //
  return app
}
