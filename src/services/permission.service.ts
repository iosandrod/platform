import { LocalStrategy } from '@feathersjs/authentication-local'
import { useAuthenticate, useMethodTransform, useRoute } from '../decoration'
import { BaseService } from './base.service'
import { HookContext, hooks } from '@feathersjs/hooks'
import { BadRequest } from '@feathersjs/errors'
import { cloneDeep, get, set } from 'lodash'
import { debug } from 'feathers-hooks-common'
import { createPasswordTransform } from '../generateHooks'
import { Params } from '@feathersjs/feathers'
export class PermissionService extends BaseService {
  constructor(options: any) {
    super(options) //
  }
  async create(...args: any[]) {
    //@ts-ignore
    return await super.create(...args)
  }
}

export default PermissionService
