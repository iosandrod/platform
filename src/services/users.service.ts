import { BaseService } from './base.service'
import { useRoute } from '../decoration'
// const userSchema=
export class UsersService extends BaseService {
  @useRoute()
  async getSomeUser() {
    //
  }
} 
