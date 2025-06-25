import { BaseEntity } from '@/entity/base.entity'
import { Column } from 'typeorm'
import { dateColumn } from '@/entity/json/jsonColumnFactory'
export default class Task extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  name: string
  @Column({ type: 'integer', nullable: true })
  resourceid: number //
  @Column({ type: 'integer', nullable: true })
  craeteid: number //
  @Column({ type: 'integer', nullable: true })
  parentid: number
  @Column({ ...dateColumn({ nullable: true }) })
  start: Date
  @Column({ ...dateColumn({ nullable: true }) })
  end: Date //
}
