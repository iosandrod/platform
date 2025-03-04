import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity as TypeOrmBaseEntity
} from 'typeorm'

/**
 * 通用基础实体，包含：
 * - 自增主键 `id`
 * - 自动更新时间 `createdAt`, `updatedAt`
 */
export class BaseEntity extends TypeOrmBaseEntity {
  @PrimaryGeneratedColumn()
  id: number
  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date
  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date
}
 