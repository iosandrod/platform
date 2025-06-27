import { myFeathers } from '@/feather'
import { DataSource, DataSourceOptions } from 'typeorm'
import Task from './task.entity'
import Resource from './resource.entity'
import TaskAssignment from './taskAssignment.entity'
import Milestone from './milestone.entity'
import Calendar from './calendar.entity'
import { defaultEntity } from '@/entity'
export const ganttConfig = async (app: myFeathers) => {
  let connection = app.getLocalDefaultConnection('gantt', 1)
  let d: DataSourceOptions = {
    type: 'postgres',
    url: connection,
    synchronize: true, //
    entities: [Task, Resource, TaskAssignment, Milestone, Calendar, ...defaultEntity] //
  }
  return d
}
