import { HookContext } from "../declarations";
import { BaseService } from "./base.service";
//通用服务
import { hooks, NextFunction } from '@feathersjs/hooks'
import { LocalStrategy, passwordHash } from '@feathersjs/authentication-local'
import { HashPasswordOptions } from "@feathersjs/authentication-local/lib/hooks/hash-password";
import { BadRequest } from "@feathersjs/errors";
import { cloneDeep, get, set } from 'lodash'
import { debug } from "feathers-hooks-common";
import { useTransformHooks } from "../../decoration";
import { createUsersPasswordHook } from "../../generateHooks";

//创建数据转换器

@useTransformHooks(createUsersPasswordHook())//数据转化
export class UsersService extends BaseService {
    constructor(options: any) {//
        super(options)
    }
    //创建用户l
    async create(data: any, params?: any): Promise<any> {//
        let _res = await super.create(data, params)
        return _res//
    }
    async init(mainApp?: any) { //
        await super.init(mainApp)
    }
}