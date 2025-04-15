import { LocalStrategy } from '@feathersjs/authentication-local'
import { useAuthenticate, useHook, useMethodTransform, useRoute } from '../decoration'
import { BaseService } from './base.service'
import { HookContext, hooks } from '@feathersjs/hooks'
import { BadRequest } from '@feathersjs/errors'
import { cloneDeep, get, set } from 'lodash'
import { debug } from 'feathers-hooks-common'
import { createPasswordTransform } from '../generateHooks'
@useHook({
  create: [
    async function (context: any, next: any) {
      await next()
    }
  ]
}) //
export class UsersService extends BaseService { 
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
export default UsersService
