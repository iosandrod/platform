import { Feathers } from '@feathersjs/feathers'
// import { Service } from '@feathersjs/feathers'
import { Application } from './declarations'
import { createApp } from './app/app_index'
export const subAppCreateMap = {
  erp: createApp,//
}
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
  async registerSubApp(appName: keyof typeof subAppCreateMap, companyId: string) {
    const createFn = subAppCreateMap[appName] //
    if (typeof createFn !== 'function') return// 不存在的服务不需要注册
    //@ts-ignore
    const subApp = createFn(this, companyId) //
    let key = `${appName}_${companyId}`//
    let routePath = `/${key}`//
    this.use(routePath, subApp)
    let subAppMap = this.subApp
    //@ts-ignore
    subAppMap[key] = subApp
    return subApp
  }
}
export const createFeathers = () => {
  //@ts-ignore
  const feathers = new myFeathers() as Application//
  return feathers//
}
