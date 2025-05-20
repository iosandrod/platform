import { Column } from 'typeorm'
import { BaseEntity } from './base.entity'
import { Entity as _Entity } from 'typeorm'
@_Entity('entity')
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
  @Column({ type: 'jsonb', nullable: true })
  layout: string //
  //is json
  @Column({
    type: 'jsonb', //
    nullable: true ////
  })
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
  @Column({ type: 'jsonb', nullable: true })
  hooks: string //
  @Column({ type: 'jsonb', nullable: true })
  dialog: string
  @Column({ type: 'jsonb', nullable: true })
  searchDialog: string //
  @Column({ type: 'varchar', nullable: true })
  pageEditType: string //
} //
