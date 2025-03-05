import { Entity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { Role } from "./roles.entity";
import { Permission } from "./permissions.entity";
import { BaseEntity } from "./base.entity";

@Entity("role_permissions")
export class RolePermission extends BaseEntity {

}
