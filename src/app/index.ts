import { Application, feathers } from '@feathersjs/feathers'
import configuration from '@feathersjs/configuration'
import { configurationValidator } from './app_config/index'

export const createApp = (mainApp: Application) => {
  const app = feathers()
  //@ts-ignore
  app.configure(configuration(configurationValidator))
  app.mainApp = mainApp //
}
