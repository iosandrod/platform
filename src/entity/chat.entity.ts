import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  BaseEntity as TypeOrmBaseEntity
} from 'typeorm'
import { BaseEntity } from './base.entity'
/**
 * 通用基础实体
 */

/**
 * 用户
 */

/**
 * 会话（私聊/群聊）
 */
@Entity('conversations')
export class Conversation extends BaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: true })
  title?: string

  @Column({ type: 'boolean', default: false })
  isGroup: boolean

  /** 成员列表：存储用户ID数组 */
  @Column({ type: 'simple-array' })
  memberIds: number[]

  @OneToMany(() => Message, message => message.conversation, { cascade: true })
  messages: Message[]
}

/**
 * 消息类型
 */
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file'
}

/**
 * 消息
 */
@Entity('messages')
export class Message extends BaseEntity {
  @ManyToOne(() => Conversation, conv => conv.messages, { nullable: false })
  conversation: Conversation
  @Column()
  conversationId: number

  @Column({ nullable: true, type: 'integer' })
  userId: number
  @Column()
  senderId: number
  @Column({ type: 'varchar', nullable: true })
  type: string
  @Column({ type: 'text' })
  content: string
}

/**
 * 附件
 */
@Entity('attachments')
export class Attachment extends BaseEntity {
  @Column({ type: 'integer', nullable: true })
  messageId: number
  @Column({ type: 'varchar', nullable: true })
  url: string
  @Column({ type: 'varchar', nullable: true })
  mimeType?: string
}
