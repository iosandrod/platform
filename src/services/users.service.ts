import { LocalStrategy } from '@feathersjs/authentication-local'
import { useAuthenticate, useHook, useMethodTransform, useRoute, useUnAuthenticate } from '../decoration'
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
    //@ts-ignore
    // hooks(this, {
    //   before: {

    //   }
    // })
  }
  @useRoute()
  // @useAuthenticate()
  async getSomeUser(context: any, params: any) {
    return {
      test: 111
    }
  }
  //@ts-ignore
  async find(...args) {
    return super.find(...args)
  }//
  @useRoute() //
  async getAllTable(context: any) {
    console.log(context, 'testContext') ////
    return
  }
  @useMethodTransform({
    //@ts-ignore
    password: createPasswordTransform()
  })
  @useUnAuthenticate()
  async create(...args: any[]) {
    //@ts-ignore
    return await super.create(...args)
  }
  @useRoute()
  @useAuthenticate() //
  async getOneUser(context: any, params: any) {
    console.log(this.hooksMetaData)//
    return {
      test: 2
    }
  }
}
export default UsersService
