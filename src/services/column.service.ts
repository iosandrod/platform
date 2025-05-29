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
  ],
  create: [
    async (context: HookContext, next: any) => {
      let data = context.data || {} //
      let _this = context.app.service('columns')
      let allD = await _this.find()
      if (Array.isArray(data)) {//
        let _data = data
          .map(item => {
            let tableName = item.tableName
            let field = item.field
            if (allD.findIndex((v: any) => v.tableName == tableName && v.field == field) != -1) {
              return null
            }
            return item//
          })
          .filter(v => v != null)
          // console.log(_data,allD)//
        context.data = _data //
      }
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
