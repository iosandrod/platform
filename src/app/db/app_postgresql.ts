import { Application } from '@feathersjs/feathers'
import knex from 'knex'

export const appPostgresql = (app: Application, _config: any) => {
  //
  let companyId = app.get('companyid') //获取公司ID
  companyId = companyId || 1
  const mainApp = app.mainApp //主应用
  let config1 = mainApp?.get(`postgresql_${companyId}_erp`) //获取配置
  //先写死
  //   config = config || {
  //     client: 'pg',
  //     connection: 'postgres://postgres:123456@localhost:5432/erp'
  //   }
  let client = 'pg'
  let connection = _config.connection
  let config = {
    client,
    connection
  }
//   console.log(_config, 'test_config') //
  const db = knex(config!)
  app.set('postgresqlClient', db) //
  mainApp?.set(`postgresqlClient_${companyId}_erp`, db) //
}
