import { LocalStrategy } from "@feathersjs/authentication-local"
import { BadRequest } from "@feathersjs/errors"
import { HookContext } from "@feathersjs/feathers"
import { debug } from 'feathers-hooks-common'
import { set, cloneDeep, get } from "lodash"

export const createUsersPasswordHook = (config?: any) => {
    return {
        method: "create",
        fn: async function (context: HookContext, next: any) {
            const { app, params, data } = context
            let options = { strategy: 'local', authentication: 'authentication' }//
            const { strategy = 'local' } = options
            //@ts-ignore
            const authService = app!.defaultAuthentication(options.authentication)
            const [localStrategy] = authService.getStrategies(strategy) as LocalStrategy[]
            if (!localStrategy || typeof localStrategy.hashPassword !== 'function') {
                throw new BadRequest(`Could not find '${strategy}' strategy to hash password`)
            }
            let field = authService.configuration.local?.passwordField || 'password'
            let addHashedPassword = async (data: any) => {
                const password = get(data, field)
                if (password === undefined) {
                    debug(`hook.data.${field} is undefined, not hashing password`)
                    throw new BadRequest(`hook.data.${field} is undefined, not hashing password`)
                }
                const hashedPassword: string = await localStrategy.hashPassword(password, params)
                let d1 = set(cloneDeep(data), field, hashedPassword)
                return d1
            }
            let rData = await addHashedPassword(data)
            context.data = rData
            await next()
        }
    }
}