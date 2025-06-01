import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'
import { BaseEntity } from './base.entity'
import { jsonColumn } from './json/jsonColumnFactory'

@Entity('selection')
export class Selection extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  datasql: string // read, create, update, delete, manage
  @Column( jsonColumn({
      nullable: true
    }))
  options: string // Article, Comment, User, all
}
