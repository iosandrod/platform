import { HookContext } from '@feathersjs/feathers'
import { useHook } from '../decoration'
import { BaseService } from './base.service'
import { myFeathers } from '../feather'
@useHook({
    //
    find: [
        async (context: HookContext, next: any) => {
            const query = context.query || {}//
            await next()
        }
    ]
})
export class ColumnService extends BaseService { }

export default ColumnService
