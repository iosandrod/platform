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
      let params = context.params//
      let _this: EntityService = context.app.service('entity') //      
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
          await colService.create(_cols) //
          let _res = await _this.create(defaultTableInfo) ////
          return _res //
        }
      } else {
        // console.log('获取了entity')//
        let result = context.result
        for (let res of result) {
          let fields = res?.fields
          let tableName = res?.tableName
          let allCol = await _this.getAllColumns(tableName)
          // console.log(allCol,'testAll')//
          let hasPrimaryKey = allCol.some((col: any) => col.primary != null)
          if (hasPrimaryKey == false) {
            //
            let _config = await _this.getTableConfig(tableName)
            let _columns = _config?.columns || []
            let keyCol = _columns.find((col: any) => col.primary != null)
          }//
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
                    } //
                  })//
                  let _columns = f?.options?.columns || []//
                  let isMain = tableName == res.tableName
                  if (tableName == null) {
                    isMain = false
                  }
                  mergeCols(_columns, oldColumns, isMain) //
                  f.options = { ...f.options, columns: _columns }
                }
              }
            }
          }
          res.columns = allCol
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
    if (tableName == null) {//
      return null
    }
    let targetTable = app.getDefaultPageLayout(tableName) //
    return targetTable //
  }
  //@ts-ignore
  @useRoute()
  async hasEntity(data: string) {
    if (Boolean(data) == false || typeof data != 'string') {
      return false
    }
    let hTable = this.app.getTableConfig(data)//
    if (hTable == null) {
      let _d = await this.find({
        query: {
          tableName: data
        }
      })
      if (_d.length == 0) {
        return false
      }
    }
    return true//
  }
  async getAllColumns(tableName: string) {
    let _tableName = tableName.split('---')
    tableName = _tableName[0]
    let app = this.app
    let colS = app.service('columns')
    let cols = await colS.find({ query: { tableName } })
    // console.log(cols, 'testCols')//
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
