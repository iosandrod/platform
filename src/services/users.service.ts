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
import { myAuth } from '@/auth'
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
  @useRoute()
  @useAuthenticate() //
  async updatePassword(data: any, params: any) {
    let newPassword = data.newPassword //
    let oldPassword = data.oldPassword //
    let userid = this.app.getUserId(params)
    let user = this.app.getUser(params) //

    if (userid == null) {
      return new errors.BadRequest('用户不存在') //
    }
    let authService: myAuth = this.app.service('authentication') as any
    // console.log(data, 'estP') //
    let confirm = await authService.comparePassword(user, oldPassword) //
    if (confirm == false) {
      return new errors.BadRequest('旧密码错误') //
    }
    if (Boolean(newPassword) == false) {
      return new errors.BadRequest('新密码不能为空') //
    }
    let _newPassword = await authService.hashPassword(newPassword, {})
    let newObj = {
      password: _newPassword
    }
    await this.update(userid, newObj) //
    return '修改密码成功'
    // let msg = ''
    // console.log(isTrue, 'isTrue') //
    // if (isTrue == false) {
    //   msg = '旧密码错误'
    // } else {
    //   msg = '旧密码正确' //
    // }
    // return msg //
  }
  @useRoute()
  async forgetPassword(data: any) {}
  @useRoute()
  async canOpenApp(data: any, params: any) {
    let userid = this.app.getUserId(params) //
    let appName = data.appName
    let mainApp = this.app.getMainApp()!
    let key = `${appName}_${userid}` //
    let subApp = mainApp.subApp
    let tApp = subApp[key]
    if (tApp == null) {
      throw new errors.BadRequest('没有权限')
    }
    return 'success' //
  }
  @useRoute()
  async canOpenSubApp(data: any, params: any) {
    let appName = data.appName //
    let userid = data.userid
    let mainApp = this.app.getMainApp()!
    let key = `${appName}_${userid}` //
    let subApp = mainApp.subApp
    let tApp = subApp[key]
    if (tApp == null) {
      throw new errors.BadRequest('请选择正确账套') //
    } //
    return 'success' //
  }
}
export default UsersService
