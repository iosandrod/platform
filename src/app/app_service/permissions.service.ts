import { useRoute } from '../../decoration'
import { BaseService } from './base.service'

export class PermissionService extends BaseService {
  constructor(options: any) {
    super(options)
  }
  @useRoute()
  async getAllPermissions() {
    let app = this.app //
    // let allTable = await app.getCompanyTable()
    // //所有的表结构
    // let tNames = allTable.map((t: any) => t.tableName)
    let allEn = await app.service('entity').find({ query: {} })
    let _ens = allEn
      .map((en: any) => {
        let tableName = en.tableName
        let fields = en.fields
        let allBtns = fields
          .filter((f: any) => {
            return f.type == 'buttongroup'
          })
          .map((f: any) => {
            let tableName = f.tableName
            return {
              //
              tableName,
              items: f?.options?.items || []
            }
          })
        let isEdit = false
        if (tableName.split('---').length > 1) {
          let isEdit = tableName.split('---')[1] == 'edit'
          if (isEdit == false) {
            return null
          }
        }
        let realTableName = tableName.split('---')[0]
        return {
          realTableName,
          isEdit,
          tableName,
          tableCnName: en.tableCnName || tableName, //
          allBtns
        }
      })
      .filter((f: any) => f != null)
    return _ens
  }
}
export default PermissionService
