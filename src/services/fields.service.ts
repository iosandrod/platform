import { LocalStrategy } from '@feathersjs/authentication-local'
import { useAuthenticate, useMethodTransform, useRoute } from '../decoration'
import { BaseService } from './base.service'
import { HookContext, hooks } from '@feathersjs/hooks'
import { BadRequest } from '@feathersjs/errors'
import { cloneDeep, get, set } from 'lodash'
import { debug } from 'feathers-hooks-common'
import { createPasswordTransform } from '../generateHooks'
import { Params } from '@feathersjs/feathers'
export class FieldsService extends BaseService {
  constructor(options: any) {
    super(options) //
  }
  async create(...args: any[]) {
    //@ts-ignore
    return await super.create(...args)
  }
  @useRoute()
  async getDefaultPageLayout(data: any, context: any) {
    let app = this.app //
    let tableName = data.tableName
    if (tableName == null) {
      return null
    }
    let targetTable = app.getDefaultPageLayout(tableName) //
    return targetTable //
  }
}

export default FieldsService
