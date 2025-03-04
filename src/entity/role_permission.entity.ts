import { Entity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { Role } from "./roles.entity";
import { Permission } from "./permissions.entity";
import { BaseEntity } from "./base.entity";

@Entity("role_permissions")
export class RolePermission extends BaseEntity {
    @ManyToOne(() => Role, (role) => role.permissions, { onDelete: "CASCADE" })
    role: Role;

    @ManyToOne(() => Permission, { onDelete: "CASCADE" })
    permission: Permission;
}
