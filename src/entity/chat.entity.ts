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
 */
@Entity('groups')
export class Conversation extends BaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: true })
  title?: string
  @Column({ type: 'integer', nullable: true })
  createrId: number //
} //


@Entity('messages')
export class Message extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  content: string
  @Column({ nullable: true, type: 'varchar' })
  type: string
  @Column({ nullable: true, type: 'integer' })
  toContactId: number
  @Column({ nullable: true, type: 'integer' })
  fromUserId: number
  @Column({ nullable: true, type: 'integer' })
  groupId: number
  @Column({ nullable: true, type: 'integer' })
  status: number //
  @Column({ nullable: true, type: 'varchar' })
  fileName: string
  @Column({ nullable: true, type: 'integer' })
  fileSize: number
}

//好友中间表
@Entity('friends')
export class Friend extends BaseEntity {
  @Column({ nullable: true, type: 'integer' })
  userid: number
  @Column({ nullable: true, type: 'integer' })
  friendid: number //
  @Column({ nullable: true, type: 'integer' })
  fromid: number
  @Column({ nullable: true, type: 'integer', default: 0 }) //
  confirmfriendid: number //
  @Column({ nullable: true, type: 'varchar' })
  status: string //
}
//群中间表
@Entity('group_users')
export class GroupUser extends BaseEntity {
  @Column({ nullable: true, type: 'integer' })
  userid: number
  @Column({ nullable: true, type: 'integer' })
  groupid: number //
}

/**
 * 附件

 */
@Entity('attachments') //
export class Attachment extends BaseEntity {
  @Column({ type: 'integer', nullable: true })
  messageid: number
  @Column({ type: 'varchar', nullable: true })
  url: string
  @Column({ type: 'varchar', nullable: true })
  mimetype?: string
}
export const charArr = [Conversation, Message, Attachment, GroupUser, Friend] //
