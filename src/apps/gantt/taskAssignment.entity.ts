import { BaseEntity } from '@/entity/base.entity'
import { Column } from 'typeorm'
import { dateColumn } from '@/entity/json/jsonColumnFactory'
//任务分配
export default class TaskAssignment extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  name: string
  @Column({ type: 'varchar', nullable: true })
  type: string
  @Column({ type: 'integer', nullable: true })
  taskid: number
  @Column({ type: 'integer', nullable: true })
  resourceid: number
  //分配
  @Column({ type: 'integer', nullable: true })
  amount: number //
} //
