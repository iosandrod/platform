import { Application, feathers } from '@feathersjs/feathers'
import configuration from '@feathersjs/configuration'
import { configurationValidator } from './app_config/index'
import { appPostgresql } from './db/app_postgresql'
import { services } from './app_service'
import { routing } from '@feathersjs/transport-commons'

export const createApp = (mainApp: Application) => {
  const app = feathers()
  //@ts-ignore
  app.mainApp = mainApp //
  // app.set('appName', 'erp')//
  app.configure(configuration(configurationValidator))
  app.configure(routing)//设置路由和认证相关的//
  //前台需要知道用户的角色和ID才可以进行操作
  app.configure(appPostgresql)//设置数据库
  app.configure(services)//设置服务
  //先进行普通的用户校验
  return app
}
