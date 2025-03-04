import { Application, feathers } from '@feathersjs/feathers'
import configuration from '@feathersjs/configuration'
import { configurationValidator } from './app_config/index'
import { appPostgresql } from './db'

export const createApp = (mainApp: Application) => {
  const app = feathers()
  //@ts-ignore
  app.mainApp = mainApp //
  app.configure(configuration(configurationValidator))
  //前台需要知道用户的角色和ID才可以进行操作
  app.configure(appPostgresql)//设置数据库
  //先进行普通的用户校验

}
