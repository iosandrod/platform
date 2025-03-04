import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, JoinTable } from "typeorm";
import { User } from "./users.entitiy";
import { Permission } from "./permissions.entity";
import { BaseEntity } from "./base.entity";

@Entity("roles")
export class Role extends BaseEntity {

  @Column({ type: "varchar", unique: true })
  name: string; // admin, editor, user

  @OneToMany(() => User, (user) => user.role)
  users: User[];

  @ManyToMany(() => Permission)
  @JoinTable({ name: "role_permissions" }) // 角色权限表
  permissions: Permission[];
}