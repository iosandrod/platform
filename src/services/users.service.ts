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
  serviceName: string = 'users' //
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
  } //
  @useRoute() //
  async getContact(data: any) {
    let app = this.app //
    let userid = data.userid //
    let fService = app.service('friends')
    let d = await fService.find({
      query: {
        userid
      }
    })
    let fId = d.map((item: any) => item.friendid)
    let uService = app.service('users')
    let u = await uService.find({
      query: {
        id: {
          $in: fId
        }
      }
    }) //
    return u //
  } //
  async getGroup(data: any) {
    let app = this.app //
    let userid = data.userid //
    let fService = app.service('group_users')
    let d = await fService.find({
      query: {
        userid
      }
    })
    let groups = d.map((item: any) => item.groupid)
    let gService = app.service('groups')
    let g = await gService.find({
      query: {
        id: {
          $in: groups
        }
      }
    }) //
    return g //
  }
  @useRoute() //
  async addFriend(data: any) {
    let app = this.app //
    let userid = data.userid //
    let friendid = data.friendid //
    let fService = app.service('friends')
    await fService.create({ userid, friendid })
    return '添加好友成功' //
  }
}
export default UsersService
