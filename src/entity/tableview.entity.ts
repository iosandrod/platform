import { Column } from 'typeorm'
import { BaseEntity } from './base.entity'
import { Entity as _Entity } from 'typeorm'
import { jsonColumn } from './json/jsonColumnFactory'

@_Entity('tableview')
export class TableView extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  viewName: string // 视图名称（可供用户自定义）
  @Column({ type: 'varchar', nullable: true })
  entityTableName: string // 对应的实体表名
  @Column({ type: 'varchar', nullable: true })
  title: string // 表格中文标题（用于页面展示）
  @Column({ type: 'varchar', nullable: true })
  sql: string // 查询语句
  @Column(
    jsonColumn({
      nullable: true
    })
  )
  columns: string // 表格列配置（如字段名、宽度、是否可编辑、是否显示等）
  @Column(
    jsonColumn({
      nullable: true
    })
  )
  actions: string // 表格行操作按钮配置（如编辑、删除、查看）
  @Column({ type: 'varchar', nullable: true })
  rowKey: string // 主键字段名，用于渲染 key
  @Column(
    jsonColumn({
      nullable: true
    })

  )
  styleConfig: string // 样式配置，如行高、斑马纹、边框等

  @Column(
    jsonColumn({
      nullable: true
    })
  )
  toolbarConfig: string // 工具栏配置（如导出、刷新、自定义按钮）

  @Column(
    jsonColumn({
      nullable: true
    })
  )
  editDialogConfig: string // 编辑弹窗配置（如果不是行内编辑而是弹窗）

  @Column({ type: 'varchar', nullable: true })
  viewType: string // 视图类型：如 "list", "kanban", "tree", "table"

  @Column({ type: 'varchar', nullable: true })
  description: string // 视图说明

  @Column({ type: 'jsonb', nullable: true })
  layout: string // 表格布局位置、宽度、是否浮动等
}
