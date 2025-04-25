import { HookContext } from '@feathersjs/feathers'
import { useHook } from '../decoration'
import { BaseService } from './base.service'
import { myFeathers } from '../feather'
@useHook({
  //
  find: [
    //
    async function (context: HookContext, next: any) {
      await next()
      const res = context
      const result = res.result // isArray
      //@ts-ignore
      const app: myFeathers = context.app//
      // let users = await context.app.service('users').find()
      // console.log(users, 'testUsers')//
      for (const res of result) {
        //获取所有表格//
        let name = res.companyid ////
        let allTable = await app.getCompanyTable(name)//
        res.entities = allTable ////
      }
    }
  ]
})//
export class CompanyService extends BaseService { }

export default CompanyService
