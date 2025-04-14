import { BaseService } from "./base.service";
import { hooks } from '@feathersjs/hooks'
import { authenticate } from "@feathersjs/authentication";

export class RoleService extends BaseService {
    constructor(options: any) {
        super(options)
        hooks(this, {
            create: [
                authenticate('jwt')//
            ]
        })
    }
    async create(data: any, params?: any): Promise<any> {
        return {
            test: 'erp的用户'
        }
    }
}

export default RoleService