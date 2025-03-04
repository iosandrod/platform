import { Entity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { User } from "./users.entitiy";
import { Permission } from "./permissions.entity";
import { BaseEntity } from "./base.entity";

@Entity("user_permissions")
export class UserPermission extends BaseEntity {

    @ManyToOne(() => User, (user) => user.permissions, { onDelete: "CASCADE" })
    user: User;

    @ManyToOne(() => Permission, { onDelete: "CASCADE" })
    permission: Permission;
}
