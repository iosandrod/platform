import { LocalStrategy } from '@feathersjs/authentication-local'
import { useRoute, useTransformHooks } from '../decoration'
import { BaseService } from './base.service'
import { HookContext, hooks } from '@feathersjs/hooks'
import { BadRequest } from '@feathersjs/errors'
import { cloneDeep, get, set } from 'lodash'
import { debug } from 'feathers-hooks-common'
import { createUsersPasswordHook } from '../generateHooks'

@useTransformHooks(createUsersPasswordHook())
export class UsersService extends BaseService {
  constructor(options: any) {
    super(options) //
    hooks(this, {
      create: [
        async function (context: HookContext, next) {
          console.log(Object.keys(context), '111')//
          await next()
        }
      ],
      //这种写法适合有methods的//
      getSomeUser: [
        async function (context: HookContext, next) {
          await next()
        }
      ]
    })
  }
  @useRoute()
  async getSomeUser(context: any, params: any) {
    return {
      test: 1
    }
  }
}
