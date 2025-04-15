import { HookContext } from '../declarations'
import { BaseService } from './base.service'
//通用服务
import { hooks, NextFunction } from '@feathersjs/hooks'
import { LocalStrategy, passwordHash } from '@feathersjs/authentication-local'
import { HashPasswordOptions } from '@feathersjs/authentication-local/lib/hooks/hash-password'
import { BadRequest } from '@feathersjs/errors'
import { cloneDeep, get, set } from 'lodash'
import { debug } from 'feathers-hooks-common'
import { useAuthenticate, useHook, useMethodTransform } from '../../decoration'
import { createPasswordTransform } from '../../generateHooks'
//创建数据转换器
useHook({
  
})
export class UsersService extends BaseService {
  constructor(options: any) {
    //
    super(options)
  }
  //创建用户l
  @useMethodTransform({
    //@ts-ignore
    password: createPasswordTransform()
  })
  async create(...args: any[]) {
    //@ts-ignore
    return await super.create(...args)
  }
}
export default UsersService
