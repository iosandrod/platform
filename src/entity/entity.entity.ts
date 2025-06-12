import { Column, Unique } from 'typeorm'
import { BaseEntity } from './base.entity'
import { Entity as _Entity } from 'typeorm'
import { jsonColumn } from './json/jsonColumnFactory'
@_Entity('entity')
// @Unique(['uuid'])
export class Entity extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  //可能是视图名称
  tableName: string //表名
  @Column({ type: 'varchar', nullable: true })
  realTableName: string
  @Column({ type: 'integer', nullable: true })
  navId: number
  @Column({
    type: 'integer',
    nullable: true
  })
  parentId: number //
  @Column(
    jsonColumn({
      nullable: true
    })
  )
  layout: string //
  //is json
  @Column(
    jsonColumn({
      nullable: true
    })
  )
  fields: string
  @Column({ type: 'varchar', nullable: true })
  uuid: string
  @Column({ type: 'varchar', nullable: true })
  options: string
  @Column({ type: 'varchar', nullable: true })
  entityName: string
  @Column({ type: 'varchar', nullable: true })
  tableType: string
  @Column({ type: 'varchar', nullable: true })
  tableCnName: string //
  @Column(
    jsonColumn({
      nullable: true
    })
  )
  hooks: string //
  @Column(
    jsonColumn({
      nullable: true
    })
  ) //
  dialog: string
  @Column(
    jsonColumn({
      nullable: true
    })
  )
  searchDialog: string ////
  @Column({ type: 'varchar', nullable: true })
  pageEditType: string //
  @Column(
    jsonColumn({
      nullable: true
    })
  )
  treeConfig: string //
  @Column(
    jsonColumn({
      nullable: true
    })
  )
  //分页
  pagination: string //
  @Column({ type: 'varchar', nullable: true })
  keyColumn: string
  @Column({ type: 'varchar', nullable: true })
  keyCodeColumn: string ////
  @Column(
    jsonColumn({
      nullable: true
    })
  ) //
  methods: string //
  @Column(
    jsonColumn({
      nullable: true
    })
  )
  events: string //
  @Column({
    type: 'varchar',
    nullable: true
  }) //
  viewTableName: string
  @Column({ type: 'jsonb', nullable: true })
  dragConfig: string //
  @Column({ type: 'varchar', nullable: true })
  platform: string //
} //
