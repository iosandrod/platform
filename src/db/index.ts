import { ganttConfig } from '../apps/gantt/index'
import { myFeathers } from '../feather'
import { DataSource } from 'typeorm'
import { createApp } from '../app' //
export const gantt = async () => {
  let app = await createApp() //
  let sourceConfig: any = await ganttConfig(app) //
  let ds = new DataSource(sourceConfig)
  await ds.initialize() //
}
export const erp = async () => {}
export const main = async () => {
  const app = await createApp() //
}
const obj = {
  gantt,
  erp,
  main
}
export default async function run() {
  let NODE_DB: any = process.env.NODE_DB //
  let _obj: any = obj
  let fn = _obj[NODE_DB] //
  if (fn == null) {
    return
  } //
  await fn()
  console.log("数据库初始化成功")//
}
run()
