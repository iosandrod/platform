import { Application } from "@feathersjs/feathers"
import knex from "knex"

export const appPostgresql = (app: Application) => {
    let companyId = app.get("companyid")//获取公司ID
    companyId = companyId || 1
    const mainApp = app.mainApp//主应用
    // const config = app.get("postgresql")
    let config = mainApp?.get(`postgresql_${companyId}_erp`)//获取配置
    //先写死
    config = config || {
        client: 'pg',
        connection: 'postgres://postgres:123456@localhost:5432/erp'
    }
    const db = knex(config!)
    app.set('postgresqlClient', db)
    mainApp?.set(`postgresqlClient_${companyId}_erp`, db)//
}