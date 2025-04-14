import { Column } from 'typeorm'
import { BaseEntity } from './base.entity'
import { Entity as _Entity } from 'typeorm'
@_Entity('entity') //
export class Entity extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  tableName: string
  @Column({ type: 'integer', nullable: true })
  navId: number
}
//
