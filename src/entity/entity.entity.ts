import { Column } from 'typeorm'
import { BaseEntity } from './base.entity'
import { Entity as _Entity } from 'typeorm'
@_Entity('entity')
export class Entity extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  tableName: string //表名
  @Column({ type: 'integer', nullable: true })
  navId: number
  @Column({
    type: 'integer',
    nullable: true
  })
  parentId: number //
  @Column({ type: 'varchar', nullable: true })
  layout: string //
  //is json
  @Column({
    type: 'varchar',
    nullable: true
  }) //
  fields: string
  @Column({ type: 'varchar', nullable: true })
  uuid: string
  @Column({ type: 'varchar', nullable: true })
  options: string
  @Column({ type: 'varchar', nullable: true })
  entityName: string
} //
