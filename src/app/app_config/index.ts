import { createDebug } from '@feathersjs/commons'
const debug = createDebug('@/app/config')
import { Application, ApplicationHookContext, NextFunction } from '@feathersjs/feathers'
import { Schema, Validator } from '@feathersjs/schema'
import config from 'config' //
import { Type, getValidator, defaultAppConfiguration } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

// For more information about this file see https://dove.feathersjs.com/guides/cli/validators.html
import { Ajv, addFormats } from '@feathersjs/schema'
import type { FormatsPluginOptions } from '@feathersjs/schema'

const formats: FormatsPluginOptions = [
  'date-time',
  'time',
  'date',
  'email',
  'hostname',
  'ipv4',
  'ipv6',
  'uri',
  'uri-reference',
  'uuid',
  'uri-template',
  'json-pointer',
  'relative-json-pointer',
  'regex'
]

export const dataValidator: Ajv = addFormats(new Ajv({}), formats)

export const queryValidator: Ajv = addFormats(
  new Ajv({
    coerceTypes: true
  }),
  formats
)


export const configurationSchema = Type.Intersect([
  defaultAppConfiguration,
  Type.Object({
    host: Type.String(),
    port: Type.Number(),
    public: Type.String()
  })
])

export type ApplicationConfiguration = Static<typeof configurationSchema>

export const configurationValidator = getValidator(configurationSchema, dataValidator)

export  function init(schema?: Schema<any> | Validator) {
  //@ts-ignore
  const validator: Validator = typeof schema === 'function' ? schema : schema?.validate.bind(schema)

  return (app?: Application) => {
    if (!app) {
      return config
    }
    const configuration: { [key: string]: unknown } = { ...config }

    debug(`Initializing configuration for ${config.util.getEnv('NODE_ENV')} environment`)

    Object.keys(configuration).forEach(name => {
      const value = configuration[name]
      debug(`Setting ${name} configuration value to`, value)
      app.set(name, value)
    })

    if (validator) {
      app.hooks({
        setup: [
          async (_context: ApplicationHookContext, next: NextFunction) => {
            await validator(configuration)
            await next()
          }
        ]
      })
    }
    return config
  }
}
export const configuration = init(configurationValidator)
