import { HookContext } from '@feathersjs/feathers'
// import { useHook, useMethodTransform, useRoute } from '../decoration'
import { useMethodTransform, useRoute } from '@/decoration'
import { BaseService } from '@/services/base.service'
import { myFeathers } from '@/feather'

export class GroupService extends BaseService {
  //@ts-ignore
  async create(...args) {
    //@ts-ignore
    return await super.create(...args)
  }
  async getMessages(data: any) {
    let app = this.app
    let groupid = data.groupid
    let mService = app.service('messages')
    let d = await mService.find({
      query: {
        groupid
      }
    })
    return d
  } //
}

export default GroupService
