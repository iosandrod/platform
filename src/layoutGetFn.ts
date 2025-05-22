import { myFeathers } from "./feather";
import { createNodeGrid } from "./utils";

export const getDefaultPageLayout = async (_this: myFeathers, tableName: any) => {
    let allTable = await _this.getCompanyTable() //
    //本地的表格
    let tableConfig = allTable[tableName]
    if (tableConfig == null) {
        // throw new errors.NotFound(`table ${tableName} not found`) ////
        return null //
    }
    let config = {
        layout: {
            pc: [],

            mobile: [
                {
                    columns: [],
                    ..._this.createIdKey('inline')
                }
            ]
        },
        fields: [],
        data: {},
        logic: {}
    }
    let enF = { ..._this.createIdKey('entity', tableConfig) }
    let btnF = {
        ..._this.createIdKey('buttongroup', {
            items: [
                {
                    label: '新增'
                },
                {
                    label: '查询'
                }
            ]
        })
    }
    let enId = enF.id
    let sRow = createNodeGrid(enId, this)
    let btnId = btnF.id
    let btnRow = createNodeGrid(btnId, this)
    let pcLayout = config.layout.pc as any
    pcLayout.push(...[btnRow, sRow])
    let f: any[] = config.fields
    f.push(...[btnF, enF])

    return config //
}

export const getDefaultEditPageLayout = async (_this: myFeathers, tableName: any) => {
    let allTable = await _this.getCompanyTable() //
    //本地的表格
    let tableConfig = allTable[tableName]

    if (tableConfig == null) {
        // throw new errors.NotFound(`table ${tableName} not found`) ////
        return null //
    }
    let config = {
        layout: {
            pc: [],

            mobile: [
                {
                    columns: [],
                    ..._this.createIdKey('inline')
                }
            ]
        },
        fields: [],
        data: {},
        logic: {}
    }
    let lF = { ..._this.createIdKey('dform'), options: {} }
    let fId = lF.id
    let enF = {
        ..._this.createIdKey("tabs", {}),//
        columns: [
            {
                ..._this.createIdKey('tabsCol'),
                label: "表单",
                list: [
                    {
                        ..._this.createIdKey('inline'),
                        columns: [//
                            fId
                        ]
                    }
                ]
            }
        ]
    }
    let btnF = {
        ..._this.createIdKey('buttongroup', {
            items: [
                {
                    label: '新增'
                },
                {
                    label: '保存'
                }, {
                    label: '编辑'//
                }
            ]
        })
    }
    let btnId = btnF.id
    let btnRow = createNodeGrid(btnId, this)
    let pcLayout = config.layout.pc as any
    let _nodeEnf = createNodeGrid(enF, this)
    pcLayout.push(...[btnRow, _nodeEnf])//
    let f: any[] = config.fields
    f.push(...[btnF, lF])//
    return config
}


export const getDefaultImportPageLayout = async (_this: myFeathers, tableName: any, params: any) => {

}