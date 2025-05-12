import { LocalStrategy } from '@feathersjs/authentication-local'
import {
  useAuthenticate,
  useCaptCha,
  useHook,
  useMethodTransform,
  useRoute,
  useUnAuthenticate
} from '../decoration'
import { BaseService } from './base.service'
import { HookContext, hooks } from '@feathersjs/hooks'
import { BadRequest } from '@feathersjs/errors'
import { cloneDeep, get, set } from 'lodash'
import { debug } from 'feathers-hooks-common'
import { createPasswordTransform } from '../generateHooks'
import { myFeathers } from '../feather'
export class UsersService extends BaseService {
  //
  serviceName?: string | undefined = 'users' //
  constructor(options: any) {
    super(options) //
  }
  //@ts-ignore
  async find(...args) {
    return super.find(...args)
  } //

  @useMethodTransform({
    //@ts-ignore
    password: createPasswordTransform()
  })
  @useCaptCha({})
  @useUnAuthenticate()
  async create(...args: any[]) {
    //@ts-ignore
    return await super.create(...args)
  }
}
export default UsersService
