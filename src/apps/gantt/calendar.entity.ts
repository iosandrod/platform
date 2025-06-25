import { BaseEntity } from '@/entity/base.entity'
import { Column } from 'typeorm'
import { dateColumn } from '@/entity/json/jsonColumnFactory'
export default class Calendar extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  name: string
  @Column({ type: 'varchar', nullable: true })
  type: string //
} //
