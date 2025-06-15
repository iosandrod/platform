import { HookContext } from '@feathersjs/feathers'
// import { useHook, useMethodTransform, useRoute } from '../decoration'
import { BaseService } from '../base.service'
import { myFeathers } from '@/feather'
import { useRoute } from '../../decoration'

export class GroupService extends BaseService {
  //@ts-ignore
  async create(...args) {
    //@ts-ignore
    return await super.create(...args)
  }
  @useRoute() //
  async getMessages(data: any, params: any) {
    let app = this.app
    let groupid = data.groupid
    let mService = app.service('messages')
    let d = await mService.find({
      query: {
        groupid
      }
    }) //
    return d
  } //
}

export default GroupService
