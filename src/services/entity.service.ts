import { LocalStrategy } from '@feathersjs/authentication-local'
import { useAuthenticate, useHook, useMethodTransform, useRoute } from '../decoration'
import { BaseService } from './base.service'
import { HookContext, hooks } from '@feathersjs/hooks'
import { BadRequest, errors } from '@feathersjs/errors'
import { cloneDeep, get, set } from 'lodash'
import { debug } from 'feathers-hooks-common'
import { createPasswordTransform } from '../generateHooks'
import { Params } from '@feathersjs/feathers'
import { myFeathers } from '../feather'
import { mergeCols, mergeEditCols } from '../utils'
import { batchInsert } from '../featherFn'
@useHook({
  find: [
    async (context: HookContext, next) => {
      await next()
      let result = context.result
      let query = context.params?.query || {}
      let params = context.params //
      let _this: EntityService = context.app.service('entity') //
      if (
        Object.keys(query).includes('tableName') &&
        Object.keys(query).length == 1 &&
        Array.isArray(result) &&
        result.length == 0
      ) {
        //获取默认的表格信息//
        let tableName: string = query.tableName
        let realTableName = tableName
        let _t1Arr = tableName.split('---')
        let isEdit = false
        let isSearch = false
        let isImport = false //
        if (_t1Arr.length > 1) {
          realTableName = _t1Arr[0] //
          let type = _t1Arr[1]
          if (type == 'edit') {
            isEdit = true
          }
          if (type == 'search') {
            isSearch = true //
          } //
          if (type == 'import') {
            isImport = true
          }
        }
        let obj = {
          tableName: realTableName
        }
        let defaultTableInfo: any = null
        if (isEdit == true) {
          defaultTableInfo = await _this.getDefaultEditPageLayout(obj, params)
        } else if (isSearch == true) {
          defaultTableInfo = await _this.getDefaultSearchPageLayout(obj, params)
        } else if (isImport == true) {
          defaultTableInfo = await _this.getDefaultImportPageLayout(obj, params)
        } else {
          //
          defaultTableInfo = await _this.getDefaultPageLayout(obj, params)
        }
        let tConfig: any = defaultTableInfo?.fields.find((c: any) => c.type == 'entity')
        if (defaultTableInfo == null) {
          return //
        }
        defaultTableInfo.tableName = tableName //
        let cols = tConfig?.options?.columns || []
        let colService = context.app.service('columns') //
        if (defaultTableInfo != null) {
          context.result = [defaultTableInfo] //
          let oldCols = await colService.find({
            queyr: {
              tableName: tableName
            }
          })
          let allF = oldCols.map((f: any) => {
            return f.field
          }) //
          let _cols = cols.filter((f1: any) => {
            return allF.includes(f1.field)
          })
          if (_t1Arr.length == 1) {
            await colService.create(_cols) //
          }
          let _res = await _this.create(defaultTableInfo)
        }
      } else {
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
          }
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
                  }) //
                  let _columns = f?.options?.columns || [] //
                  let isMain = tableName == res.tableName
                  if (tableName == null) {
                    isMain = false
                  }
                  mergeCols(_columns, oldColumns, isMain) //
                  f.options = { ...f.options, columns: _columns }
                }
              }
              if (type == 'dform') {
                let tableName = f?.options?.tableName
                if (tableName) {
                  let rTableName = tableName.split('---')[0]
                  let oldColumns = await context.app.service('columns').find({
                    query: {
                      tableName: rTableName
                    } //
                  })
                  let _field = f.options?.layoutData?.fields || []
                  if (Array.isArray(_field)) {
                    mergeEditCols(_field, oldColumns)
                  }
                }
              }
            }
          }
          res.columns = allCol
        }
      }
      let _res = context.result
      for (const en of _res) {
        let tableName = en?.tableName //
        if (en.keyColumn != null) {
          continue //
        }
        tableName = tableName.split('---')[0]
        let _app: myFeathers = context.app
        let _tConfig = await _app.getTableConfig(tableName)
        if (_tConfig) {
          let _columns = _tConfig?.columns || []
          let primaryKey = _columns.find((col: any) => col.is_primary_key == true)
          if (primaryKey) {
            let _key = primaryKey?.column_name
            en.keyColumn = _key //
          }
        }
      }
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
      //
      return null
    }
    let targetTable = app.getDefaultPageLayout(tableName) //
    return targetTable //
  }
  async getDefaultSearchPageLayout(data: any, params: any) {
    //
    let app = this.app //
    let tableName = data.tableName
    if (tableName == null) {
      //
      return null
    }
    let sInfo = await this.find({ query: { tableName } })
    let row = sInfo?.[0]
    if (row == null) {
      throw new errors.BadGateway('找不到模块') //
    } ////
    let _row = { ...row, createdAt: null, updatedAt: null } //
    delete _row.id
    delete _row.createdAt
    delete _row.updatedAt
    let allKey = Object.keys(_row)
    for (let key of allKey) {
      if (_row[key] == null) {
        delete _row[key] //
      }
    }
    // console.log('我执行到这里了') //
    return _row //
    // let targetTable = await app.getDefaultSearchPageLayout(tableName, params) //
    // return targetTable //
  }
  async getDefaultImportPageLayout(data: any, params: any) {
    console.log('执行到这里了') //
    let tableName = data.tableName
    if (tableName == null) {
      return null //
    } //
    let app = this.app
    let importLayout = app.getDefaultImportPageLayout(tableName, params)
    if (importLayout == null) {
      return null
    }
    //处理导入的页面
    return importLayout
  }
  async getDefaultEditPageLayout(data: any, context: any) {
    //
    let tableName = data.tableName
    if (tableName == null) {
      return null //
    }
    let app = this.app
    let editLayout = app.getDefaultEditPageLayout(tableName)
    return editLayout
  }
  //@ts-ignore
  @useRoute()
  async hasEntity(data: string) {
    if (Boolean(data) == false || typeof data != 'string') {
      return false
    }
    let hTable = this.app.getTableConfig(data) //
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
    return true //
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
  @useRoute() //
  async getTableConfig(tableName: any) {
    if (typeof tableName == 'string') {
      tableName = {
        tableName
      }
    }
    let _tableName = tableName.tableName
    if (Boolean(_tableName) == false) {
      throw new errors.BadGateway('找不到表格配置信息')
    } //
    let app = this.app
    return app.getTableConfig(_tableName) //
  }
  @useRoute() //
  async syncTableData(data: any) {
    let app = this.app
    if (app.getIsMain()) {
      return []
    }
    let appName = app.getAppName() //
    // console.log(appName, 'testName') //
    let dCon = await app.getDefaultAppConnection(appName)
    /* 
    {
      appName,
      companyid: app.getCompanyId()//
    }
    */
    let mCon = await app.getCompanyConnection() //
    let tableName = data?.tableName || data //
    if (tableName == null) {
      return []
    }
    if (!Array.isArray(tableName)) {
      tableName = [tableName]
    }
    for (const name of tableName) {
      await batchInsert(dCon, mCon, name) //
    }
    return '同步数据成功' //
    //获取相关链接
  }
  @useRoute()
  async getDefaultButtons(data: any) {
    //
    let type = data.type
    if (!['main', 'edit'].includes(type)) {
      return []
    } //
    let _buttons = []
  }
}

export default EntityService
