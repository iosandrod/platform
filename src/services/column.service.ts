import { HookContext } from '@feathersjs/feathers'
import { useHook, useMethodTransform } from '../decoration'
import { BaseService } from './base.service'
import { myFeathers } from '../feather'
@useHook({
  //
  find: [
    async (context: HookContext, next: any) => {
      const query = context.query || {} //
      await next()
    }
  ]
})
export class ColumnService extends BaseService {
  @useMethodTransform({
    //@ts-ignore
    nullable: value => {
      let _value = Boolean(value)
      let v = null
      if (_value == true) {
        v = 1
      } else {
        v = 0
      }
      return v
    }
  })
  //@ts-ignore
  async create(...args) {
    //@ts-ignore
    return await super.create(...args)
  }
}

export default ColumnService
