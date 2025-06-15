import { HookContext } from '@feathersjs/feathers'
// import { useHook, useMethodTransform, useRoute } from '../decoration'
import { BaseService } from '../base.service'
import { myFeathers } from '@/feather'
import { useRoute, useHook } from '../../decoration'
@useHook({
  find: [
    async (context: HookContext, next) => {
      await next() //
    }
  ]
})
export class FriendShipService extends BaseService {
  //@ts-ignore
  async create(...args) {
    //@ts-ignore
    return await super.create(...args)
  }
}
export default FriendShipService

