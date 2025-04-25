import { LocalStrategy } from '@feathersjs/authentication-local'
import { useAuthenticate, useHook, useMethodTransform, useRoute } from '../decoration'
import { BaseService } from './base.service'
import { HookContext, hooks } from '@feathersjs/hooks'
import { BadRequest } from '@feathersjs/errors'
import { cloneDeep, get, set } from 'lodash'
import { debug } from 'feathers-hooks-common'
import { createPasswordTransform } from '../generateHooks'
import { Params } from '@feathersjs/feathers'
import { myFeathers } from '../feather'
@useHook({
  find: [
    async (context: HookContext, next) => {
      await next()
      let result = context.result
      let query = context.params?.query || {}
      let params = context.params
      if (Object.keys(query).includes('tableName') && Array.isArray(result) && result.length == 0) {
        //获取默认的表格信息
        let tableName = query.tableName
        let _this = context.app.service('entity')//
        let obj = {
          tableName: tableName
        }
        let defaultTableInfo = await _this.getDefaultPageLayout(obj, params)
        context.result = [defaultTableInfo]//
      }
    }
  ]
})
export class EntityService extends BaseService {
  constructor(options: any) {
    super(options) //
  }
  @useRoute()
  @useAuthenticate()
  async getSomeUser(data: any, params: Params) {
    let app = this.app
    let Model = this.Model //
  } //
  async create(...args: any[]) {
    //@ts-ignore
    return await super.create(...args)
  }
  // @useRoute()
  async getDefaultPageLayout(data: any, context: any) {
    let app = this.app //
    let tableName = data.tableName
    if (tableName == null) {
      return null
    }
    let targetTable = app.getDefaultPageLayout(tableName) //
    return targetTable //
  }
  @useRoute()
  @useAuthenticate() //
  async getOneUser(context: any, params: any) {
    return {
      test: 2
    }
  }
}

export default EntityService
