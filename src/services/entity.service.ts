import { LocalStrategy } from '@feathersjs/authentication-local'
import { useAuthenticate, useHook, useMethodTransform, useRoute } from '../decoration'
import { BaseService } from './base.service'
import { HookContext, hooks } from '@feathersjs/hooks'
import { BadRequest } from '@feathersjs/errors'
import { cloneDeep, get, set } from 'lodash'
import { debug } from 'feathers-hooks-common'
import { createPasswordTransform } from '../generateHooks'
import { Params } from '@feathersjs/feathers'
import { myFeathers } from '../feather'
import { mergeCols } from '../utils'
@useHook({
  find: [
    async (context: HookContext, next) => {
      await next()
      let result = context.result
      let query = context.params?.query || {}
      let params = context.params
      let _this: EntityService = context.app.service('entity') //
      // console.log(query, context.result, 'query') //
      //@ts-ignore
      // console.log(_this.hooksMetaData) //
      if (
        Object.keys(query).includes('tableName') &&
        Object.keys(query).length == 1 &&
        Array.isArray(result) &&
        result.length == 0
      ) {
        //获取默认的表格信息
        let tableName = query.tableName
        let obj = {
          tableName: tableName
        }
        let defaultTableInfo: any = await _this.getDefaultPageLayout(obj, params)
        let tConfig: any = defaultTableInfo?.fields.find((c: any) => c.type == 'entity')
        if (defaultTableInfo == null) {
          return //
        }
        defaultTableInfo.tableName = tableName //
        let cols = tConfig?.options?.columns || []
        let colService = context.app.service('columns')
        if (defaultTableInfo != null) {
          context.result = [defaultTableInfo] //
          let oldCols = await colService.find({
            queyr: {
              tableName: tableName
            }
          })
          let allF = oldCols.map((f: any) => {
            return f.field
          })
          let _cols = cols.filter((f1: any) => {
            return allF.includes(f1.field)
          })
          await colService.create(_cols)//
          let _res = await _this.create(defaultTableInfo) ////
          return _res// 
        }
      } else {
        let result = context.result
        for (const res of result) {
          let fields = res?.fields
          let tableName = res?.tableName
          let allCol = await _this.getAllColumns(tableName)
          let hasPrimaryKey = allCol.some((col: any) => col.primary != null)
          if (hasPrimaryKey == false) {
            //
            let _config = await _this.getTableConfig(tableName)
            let _columns = _config?.columns || []
            let keyCol = _columns.find((col: any) => col.primary != null)
          }
          // res.columns = allCol //
          if (Array.isArray(fields)) {
            for (const f of fields) {
              let type = f?.type
              if (type == 'entity') {
                let tableName = f?.options?.tableName
                if (tableName) {

                  let oldColumns = await context.app.service('columns').find({
                    query: {
                      tableName: tableName
                    }//
                  })
                  // console.log(oldColumns,'fjsdklfsdjflsd')//
                  let _columns = f?.options?.columns || []
                  mergeCols(_columns, oldColumns) //
                  if (Array.isArray(oldColumns)) {
                    // oldColumns.forEach((col: any) => {
                    //   //有什么需要合并的呢
                    //   let f = col.filed
                    //   let nColumns = _config?.columns || []
                    //   let tCol = nColumns.find((col: any) => col.field == f)
                    //   if (tCol) {
                    //     Object.entries(tCol).forEach(([key, value]) => {
                    //       if (['title', 'order', 'hidden', 'formatFn'].includes(key)) {
                    //         //
                    //         return
                    //       } //
                    //       col[key] = value
                    //     })
                    //   }
                    // })
                  } //
                  f.options = { ...f.options, columns: _columns }
                }
              }
            }
          }
        }
      } //
    }
  ]
})
export class EntityService extends BaseService {
  constructor(options: any) {
    super(options) //
  }
  
  async create(...args: any[]) {
    //@ts-ignore
    return await super.create(...args)
  }
  // @useRoute()

  async getDefaultPageLayout(data: any, context: any) {
    let app = this.app //
    let tableName = data.tableName
    if (tableName == null) {
      return null
    }
    let targetTable = app.getDefaultPageLayout(tableName) //
    return targetTable //
  }
 
  async getAllColumns(tableName: string) {
    let _tableName = tableName.split('---')
    tableName = _tableName[0]
    let app = this.app
    let colS = app.service('columns')
    let cols = await colS.find({ query: { tableName } })
    if (cols.length == 0) {
      let _config = await app.getTableConfig(tableName)
      let _columns = _config?.columns || []
      cols = _columns //
    }
    return cols
  }
  async getTableConfig(tableName: any) {
    let app = this.app
    return app.getTableConfig(tableName)
  }
}

export default EntityService
