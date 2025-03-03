import { Feathers } from '@feathersjs/feathers'
// import { Service } from '@feathersjs/feathers'
import { Application } from './declarations'
//构建自己的feather
export class myFeathers extends Feathers<any, any> {
  subApp: {
    [key: string]: Application
  } = {}
  async getAllSubApp() {
    const services = this.services//
  }//
  async getAllCompany() {
    const companyService = this.service('company') //
    const company = await companyService.find()
  }
  async getAllApp() { }
}
export const createFeathers = () => {
  //@ts-ignore
  const feathers = new myFeathers() as Application//
  return feathers//
}
