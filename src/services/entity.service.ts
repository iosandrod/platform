import { LocalStrategy } from '@feathersjs/authentication-local'
import { useAuthenticate, useMethodTransform, useRoute, useTransformHooks } from '../decoration'
import { BaseService } from './base.service'
import { HookContext, hooks } from '@feathersjs/hooks'
import { BadRequest } from '@feathersjs/errors'
import { cloneDeep, get, set } from 'lodash'
import { debug } from 'feathers-hooks-common'
import { createPasswordTransform } from '../generateHooks'
export class EntityService extends BaseService {
  constructor(options: any) {
    super(options) //
  }
  @useRoute()
  @useAuthenticate()
  async getSomeUser(context: any, params: any) {
    return {
      test: 111
    }
  } //
  @useMethodTransform({
    //@ts-ignore
    password: createPasswordTransform()
  })
  async create(...args: any[]) {
    //@ts-ignore
    return await super.create(...args)
  }
  @useRoute()
  @useAuthenticate() //
  async getOneUser(context: any, params: any) {
    //
    return {
      test: 2
    }
  }
}

export default EntityService