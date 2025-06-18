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
import { BadRequest, errors } from '@feathersjs/errors'
import { cloneDeep, get, set } from 'lodash'
import { debug } from 'feathers-hooks-common'
import { createPasswordTransform } from '../generateHooks'
import { myFeathers } from '../feather'
@useHook({
  addFriend: [
    async (context, next) => {
      // console.log(context.arguments[1].authentication, 'testContext') //
      await next()
    }
  ]
})
export class UsersService extends BaseService {
  serviceName: string = 'users' //
  constructor(options: any) {
    super(options) //
  }
  //@ts-ignore
  async find(...args) {
    //
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
  }
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
  //发送好友请求
  async addFriend(data: any, params: any) {
    let app = this.app //
    let userid = data.userid
    let friendid = data.friendid //
    let user = this.getUserInfo(params) //
    let id = user?.id
    if (userid == null) {
      userid = id //
    }
    if (userid == null) {
      throw new errors.BadRequest('请求人不能为空')
    } //
    let fService = app.service('friends')
    let _res = await fService.create({ userid, confirmfriendid: friendid, fromid: userid, status: 'confirm' })
    return '发送好友请求成功' //
  }
  @useRoute()
  async confirmFriend(data: any, params: any) {
    let app = this.app //
    let id = data.id //
    let fService = app.service('friends')
    let user = params.user
    let uid = user.id //
    if (uid != data.confirmfriendid) {
      return new errors.BadRequest('不是你的好友请求') //
    }
    let _res = await fService.patch(id, { status: 'success', friendid: data.friendid }) //
    return '确认好友成功' //
  }
  @useRoute()
  async rejectFriend(data: any) {
    //
    let app = this.app //
    let fService = app.service('friends')
    let _res = await fService.patch(data.id, { ...data, status: 'reject' }) //
    return '拒绝好友成功' //
  } //
  @useRoute() //
  async joinGroup() {}
}
export default UsersService
