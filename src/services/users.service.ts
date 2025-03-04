import { useRoute } from '../decoration'
import { BaseService } from './base.service'
import { HookContext, hooks } from '@feathersjs/hooks'
export class UsersService extends BaseService {
  constructor(options: any) {
    super(options) //
    hooks(this, {
      //这种写法适合有methods的//
      getSomeUser: [
        async function (context:HookContext, next) {
          await next()
        }
      ] //
    })
  }
  @useRoute()
  async getSomeUser(context: any, params: any) {
    return {
      test: 1
    }
  }
}
