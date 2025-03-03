import { useRoute } from "../decoration";
import { BaseService } from "./base.service";

export class UsersService extends BaseService {
    @useRoute()
    async getSomeUser(context: any, params: any) {
        return { id: 3 }
    }
}