import { Feathers } from '@feathersjs/feathers'
// import { Service } from '@feathersjs/feathers'
import { Application } from './declarations'
import { createApp } from './app/app_index'
import knex, { Knex } from 'knex'
import { cacheValue } from './decoration'
export const subAppCreateMap = {
  erp: createApp //
}
//构建自己的feather
export class myFeathers extends Feathers<any, any> {
  cache: { [key: string]: any } = {}
  cacheKnex: { [key: string]: Knex } = {}
  subApp: {
    [key: string]: Application
  } = {}
  async getAllSubApp() {
    const services = this.services //
  } //
  async getAllCompany() {
    const companyService = this.service('company') //
    const company = await companyService.find() //
    return company //
  } //
  async getDefaultEntity(companyId: string) {
    let client = this.get('postgresqlClient')
    let allCompany = await client('company').select() //
  }
  async createCompany(config: any) {
    let client = this.get('postgresqlClient')
    let name = config.name
    let companies = await client('company').where('name', name).select()
    if (companies.length === 0) {
      let connection = config.connection
      let type = config.type
      if (connection == null) {
        return
      }
      let _client = knex({
        client: type,
        connection: connection
      })
      await client('company').insert(config) //
    }
  }
  async getAllApp() {} //
  //@ts-ignore
  async getCompanyConnection(company: any): Promise<Knex> {
    let client = this.getClient()
    if (typeof company === 'string') {
      let cacheKnex = this.cacheKnex
      let _knex = cacheKnex[company]
      if (_knex != null) {
        return _knex //
      }
      let companyInfo = await client('company').where('name', company).select() //
      let row = companyInfo[0]
      if (row == null) {
        throw new Error(`company ${company} not found`) //
      }
      let connection = companyInfo[0].connection //
      let type = companyInfo[0].type //
      let _client = knex({
        client: type,
        connection: connection
      })
      cacheKnex[company] = _client //
      return _client
    }
    if (typeof company === 'object') {
      let connection = company.connection
      let type = company.type
      let name = company.name
      if (this.cacheKnex[name] != null) return this.cacheKnex[name] //
      let _client = knex({
        client: type,
        connection: connection
      })
      this.cacheKnex[name] = _client //
      return _client
    }
  }
  @cacheValue() //
  async getCompanyTable(companyid: string) {
    let _connect = await this.getCompanyConnection(companyid) //
    let sql = `select * from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE'` //
    let tables = await _connect.raw(sql) //
    return tables //
  }
  clearCache(fnName: string, key: string) {
    if (fnName == null) {
      return
    }
    let cache = this.cache
    let allKeys = Object.keys(cache)
    for (const key of allKeys) {
      let reg = new RegExp(`^${fnName}--`)
      if (reg.test(key)) {
        delete cache[key] //
      }
    }
  }
  getClient() {
    return this.get('postgresqlClient')
  }
  async registerSubApp(appName: keyof typeof subAppCreateMap, companyId: string) {
    const allEn = null
    let c: Knex = this.get('postgresqlClient')
    // let entities = await c('entity').select() //
    await this.getDefaultEntity(companyId) //
    const createFn = subAppCreateMap[appName] //
    if (typeof createFn !== 'function') return // 不存在的服务不需要注册
    //@ts-ignore
    const subApp = await createFn(this, companyId) //
    let key = `${appName}_${companyId}` //
    let routePath = `/${key}` //
    this.use(routePath, subApp)
    let subAppMap = this.subApp
    //@ts-ignore
    subAppMap[key] = subApp
    return subApp
  }
}
export const createFeathers = () => {
  //@ts-ignore
  const feathers = new myFeathers() as Application //
  return feathers //
}
