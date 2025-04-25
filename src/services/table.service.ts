import { HookContext } from '@feathersjs/feathers'
import { useHook } from '../decoration'
import { BaseService } from './base.service'
import { myFeathers } from '../feather'
import { errors } from '@feathersjs/errors'
@useHook({
    find: [
        async (context: HookContext, next: any) => {
            const query = context.params?.query || {}
            await next()
            const result = context.result
            let app = context.app
            let colService = app.service('columns')
            if (Array.isArray(result) && result.length > 0) {
                let allTableName = result.map(row => {
                    return row.tableName
                })
                let reColumns: any[] = await colService.find({
                    query: {
                        tableName: {
                            $in: allTableName
                        }
                    }
                })
                let tableObj = reColumns.reduce((res: any, item: any) => {
                    let tableName = item.tableName
                    let t = res[tableName]
                    if (t == null) {
                        res[tableName] = []
                        t = res[tableName]
                    }
                    t.push(item)
                    return res
                }, {})
                result.forEach(res => {
                    let tableName = res.tableName
                    res['columns'] = tableObj[tableName]//
                })
            } else {
                //@ts-ignore
                let service: TableService = app.service('tables')
                let tableName = query.tableName
                if (tableName != null) {
                    let res = await service.saveDefaultTableInfo(tableName)//
                    context.result = res//
                }
            }
        }//
    ],
    create: [
        async (context, next) => {
            await next()
            let res: any = context.result
            let rows = res
            for (const item of rows) {//
                let tableName = item.tableName
                let app: myFeathers = context.app
                let colS: TableService = app.service('columns') as any
                let _this = colS
                let allTable = await app.getCompanyTable(_this.getCompanyId(), _this.getAppName())
                let tTable = allTable[tableName]
                if (tTable != null) {
                    let columns = JSON.parse(JSON.stringify(tTable.columns || []))//
                    columns.forEach((col: any) => {
                        let nullable = col.nullable
                        if (nullable == false) {
                            col.nullable = '0'
                        } else {
                            col.nullable = '1'//
                        }
                    })
                    await colS.create(columns, {})//
                }
            }//
        }
    ]
})
export class TableService extends BaseService {
    async saveDefaultTableInfo(tableName: string,) {
        console.log('我正在执行新增')//
        let app = this.app
        let allTable = await app.getCompanyTable(this.getCompanyId(), this.getAppName())
        let targetTable = allTable[tableName]
        if (targetTable == null) {
            throw new errors.BadGateway('没有找到相关表格')//
        }
        await this.create({ tableName, })
        let res1 = await this.find({
            query: {
                tableName: tableName//
            }
        })
        return res1////
    }
}

export default TableService
