import { HookContext } from '@feathersjs/feathers'
import { useHook } from '../decoration'
import { BaseService } from './base.service'
import { myFeathers } from '../feather'
type TreeNode = {
  id: string
  sort: number
  pid: string
  navname: string
  [key: string]: any
  children?: TreeNode[]
}
@useHook({
  //
  find: [
    async function (context: HookContext, next: any) {
      await next() //
      const result = context.result
      const s = context.service //
      //@ts-ignore
      // const data = result
      // context.result = s.buildTreeRecursive(data) //
    }
  ]
})
export class NavService extends BaseService {
  buildTreeRecursive(data: TreeNode[], parentId: string = '0'): TreeNode[] {
    let _data = data
      .filter(item => item.pid == parentId)
      .map(item => ({
        ...item,
        children: this.buildTreeRecursive(data, item.id) //
      }))
    _data = _data.sort((a, b) => a.sort - b.sort) //
    return _data
  }
}

export default NavService
/* 
pid,
sort,
icon,
appId,
appCode,
remark,
status,
type,
navname,
url,
*/
