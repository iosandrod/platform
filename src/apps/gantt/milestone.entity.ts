import { BaseEntity } from '@/entity/base.entity'
import { Column } from 'typeorm'
import { dateColumn } from '@/entity/json/jsonColumnFactory'
//里程碑
export default class Milestone extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  name: string
  @Column({ type: 'varchar', nullable: true })
  type: string //
}
//
