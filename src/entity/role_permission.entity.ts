import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, PrimaryColumn } from 'typeorm'
import { Role } from './roles.entity'
import { Permission } from './permissions.entity'
import { BaseEntity } from './base.entity'

@Entity('role_permissions')
export class RolePermission extends BaseEntity {
  @PrimaryColumn()
  roleId: number;
  @PrimaryColumn()
  permissionId: number;
  @Column({ type: 'varchar', nullable: true })
  note?: string;
}