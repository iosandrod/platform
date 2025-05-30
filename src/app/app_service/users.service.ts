import { HookContext } from '../declarations'
import { BaseService } from './base.service'
//通用服务
import { hooks, NextFunction } from '@feathersjs/hooks'
import { LocalStrategy, passwordHash } from '@feathersjs/authentication-local'
import { HashPasswordOptions } from '@feathersjs/authentication-local/lib/hooks/hash-password'
import { BadRequest } from '@feathersjs/errors'
import { cloneDeep, get, set } from 'lodash'
import { debug } from 'feathers-hooks-common'
import {
  useAuthenticate,
  useCaptCha,
  useHook,
  useMethodTransform,
  useRoute,
  useUnAuthenticate
} from '../../decoration'
import { createPasswordTransform } from '../../generateHooks'
//创建数据转换器
useHook({})
export class UsersService extends BaseService {
  constructor(options: any) {
    //
    super(options)
  }
  @useRoute()
  async getAllTable() {
    return [] //
  }
  //创建用户l
  @useMethodTransform({
    //@ts-ignore
    password: createPasswordTransform()
  })
  @useCaptCha({})
  @useUnAuthenticate() //
  async create(...args: any[]) {
    //@ts-ignore
    return await super.create(...args)
  }
}
export default UsersService
