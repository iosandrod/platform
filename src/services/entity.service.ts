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
      let _this = context.app.service('entity') //
      if (
        Object.keys(query).includes('tableName') &&
        Object.keys(query).length == 1 &&
        Array.isArray(result) &&
        result.length == 0
      ) {
        //获取默认的表格信息
        let tableName = query.tableName
        let obj = {
          tableName: tableName
        }
        let defaultTableInfo = await _this.getDefaultPageLayout(obj, params)
        if (defaultTableInfo != null) {
          context.result = [defaultTableInfo] //
        }
      } else {
        let result = context.result
        for (const res of result) {
          let fields = res?.fields
          if (Array.isArray(fields)) {
            for (const f of fields) {
              //
              let type = f?.type
              if (type == 'entity') {
                let tableName = f?.tableName
                if (tableName) {
                  let _config = await _this.getTableConfig(tableName)
                  let options = f?.options //
                  if (options == null) {
                    options = {}
                    f.options = options
                  }
                  f.options = { ...options, ..._config }
                }
              }
            }
          }
        }
      } //
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
  async getTableConfig(tableName: any) {
    let app = this.app
    return app.getTableConfig(tableName)
  }
}

export default EntityService
