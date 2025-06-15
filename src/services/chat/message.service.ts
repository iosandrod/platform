import { HookContext } from '@feathersjs/feathers'
// import { useHook, useMethodTransform, useRoute } from '../decoration'
import { useHook, useMethodTransform, useRoute } from '@/decoration'
import { BaseService } from '@/services/base.service'
import { myFeathers } from '@/feather' //
@useHook({
  created: [
    async (context: HookContext, next) => {
      await next() //
    }
  ]
})
export class MessageService extends BaseService {
  //@ts-ignore
  async create(...args) {
    //@ts-ignore
    return await super.create(...args)
  }
}

export default MessageService
