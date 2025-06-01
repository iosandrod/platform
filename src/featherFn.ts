import { errors } from "@feathersjs/errors";
import { myFeathers } from "./feather";
import Knex from 'knex'
export async function createNewApp(app: myFeathers, config: any) {
    let knexErp1: any = null;
    let appName = config.appName || 'erp'//
    //这个是管理员数据库
    let knexDefault = app.getMainApp()?.get('defaultConnection');
    // 2. knexErp：连接到原始数据库 erp，读取表结构
    const knexErp = app.getMainApp()?.get(`${appName}Connection`);
    if (!knexErp) {
        throw new errors.BadGateway('没有找到app的数据库')//
    }
    try {
        console.log('🔍 正在从 erp 数据库读取所有表名……');
        const tables = await knexErp('information_schema.tables')
            .select('table_schema', 'table_name')
            .where({
                table_catalog: 'erp',             // 数据库名字
                table_type: 'BASE TABLE'
            })
            //@ts-ignore
            .andWhereNot('table_schema', 'pg_catalog').andWhereNot('table_schema', 'information_schema');

        if (tables.length === 0) {
            console.log('⚠️ erp 库里没有可用的用户表，退出。');
            process.exit(1);//
        }
        // 结果示例：[{ table_schema: 'public', table_name: 'users' }, { table_schema: 'public', table_name: 'orders' }, …]
        console.log(`✅ 找到 ${tables.length} 张表。`);
        ////
        // 对每张表，分别读取列信息和它们的主键列//
        const schemaInfo: any = {}; // { 'public.users': { columns: [...], primaryKeys: [...] }, … }
        //
        for (const { table_schema, table_name } of tables) {
            const fullName = `${table_schema}.${table_name}`;
            // 读取所有列信息
            const columns = await knexErp('information_schema.columns')
                .select(
                    'column_name',
                    'data_type',
                    'is_nullable',
                    'column_default',
                    'character_maximum_length',
                    'numeric_precision',
                    'numeric_scale'
                )
                .where({
                    table_catalog: 'erp',
                    table_schema: table_schema,
                    table_name: table_name
                })
                .orderBy('ordinal_position', 'asc');

            // 读取主键信息：查 information_schema.table_constraints + key_column_usage
            const pkResult = await knexErp('information_schema.table_constraints as tc')
                .join(
                    'information_schema.key_column_usage as kcu',
                    function (this: any) {//
                        this.on('tc.constraint_name', '=', 'kcu.constraint_name')
                            .andOn('tc.table_schema', '=', 'kcu.table_schema')
                            .andOn('tc.table_name', '=', 'kcu.table_name');
                    }
                )
                .select('kcu.column_name')
                .where({
                    'tc.table_catalog': 'erp',
                    'tc.table_schema': table_schema,
                    'tc.table_name': table_name,
                    'tc.constraint_type': 'PRIMARY KEY'
                });

            const primaryKeys = pkResult.map((r: any) => r.column_name);
            //@ts-ignore
            schemaInfo[fullName] = {
                columns,
                primaryKeys
            };
            console.log(`  • 已读取表 ${fullName}，共 ${columns.length} 列，主键列：${primaryKeys.join(', ')}`);
        }

        // --------------------------
        // （三）Step3：在默认库里先创建 erp_1 数据库（如果不存在）
        // --------------------------
        console.log('\n🏗 准备创建新数据库 erp_1（如果尚不存在）……');

        // 先查一下 pg_database，避免重复创建
        const exists = await knexDefault('pg_database')
            .select('datname')
            .where({ datname: 'erp_1' })
            .first();

        if (!exists) {
            console.log('   → erp_1 数据库不存在，正在创建……');
            await knexDefault.raw('CREATE DATABASE erp_1;');
            console.log('✅ 成功创建 erp_1 数据库。');
        } else {
            console.log('   → erp_1 数据库已存在，跳过创建步骤。');
        }

        // --------------------------
        // （四）Step4：初始化 knexErp1 连接到新库 erp_1
        // --------------------------
        console.log('\n🔌 连接到新数据库 erp_1……');
        knexErp1 = Knex({
            client: 'pg',
            connection: {
                host: 'localhost',
                user: 'postgres',
                password: '123456',
                database: 'erp_1',
                port: 5432
            },
            pool: { min: 0, max: 7 }
        });
        // --------------------------
        // （五）Step5：遍历 schemaInfo，逐张在 erp_1 中建表
        // --------------------------
        console.log('\n🚧 开始在 erp_1 中创建表……');

        // …（前面已按原脚本完成：连接 knexDefault, knexErp，读出 schemaInfo 等）…

        // 假设已经切换到 erp_1，并有 knexErp1：
        for (const fullName of Object.keys(schemaInfo)) {
            const { columns, primaryKeys } = schemaInfo[fullName];
            const [schema, tableName] = fullName.split('.');

            if (schema !== 'public') {
                console.log(`跳过 schema ${schema} 下的表 ${tableName}（示例仅处理 public）`);
                continue;
            }

            // 如果表已存在，则先 drop
            if (await knexErp1.schema.withSchema(schema).hasTable(tableName)) {
                await knexErp1.schema.withSchema(schema).dropTable(tableName);
            }//
            // 在 erp_1 中重建表
            await knexErp1.schema.withSchema(schema).createTable(tableName, (table: any) => {
                for (const col of columns) {
                    const {
                        column_name,
                        data_type,
                        is_nullable,
                        column_default,
                        character_maximum_length,
                        numeric_precision,
                        numeric_scale
                    } = col;

                    let colBuilder;

                    // —— 检测是否是 SERIAL / 自增列 —— 
                    if (column_default && column_default.startsWith("nextval(")) {
                        // 直接用 .increments()（Knex 会自动创建 sequence + 默认值）
                        colBuilder = table.increments(column_name);
                    } else {
                        // —— 普通类型 —— 
                        switch (data_type) {
                            case 'integer':
                                colBuilder = table.integer(column_name);
                                break;
                            case 'smallint':
                                colBuilder = table.specificType(column_name, 'smallint');
                                break;
                            case 'bigint':
                                colBuilder = table.bigInteger(column_name);
                                break;
                            case 'character varying':
                            case 'varchar':
                                if (character_maximum_length) {
                                    colBuilder = table.string(column_name, character_maximum_length);
                                } else {
                                    colBuilder = table.string(column_name);
                                }
                                break;
                            case 'character':
                            case 'char':
                                if (character_maximum_length) {
                                    colBuilder = table.specificType(column_name, `char(${character_maximum_length})`);
                                } else {
                                    colBuilder = table.specificType(column_name, `char(1)`);
                                }
                                break;
                            case 'text':
                                colBuilder = table.text(column_name);
                                break;
                            case 'boolean':
                                colBuilder = table.boolean(column_name);
                                break;
                            case 'date':
                                colBuilder = table.date(column_name);
                                break;
                            case 'timestamp without time zone':
                            case 'timestamp with time zone':
                                colBuilder = table.timestamp(column_name);
                                break;
                            case 'double precision':
                            case 'real':
                            case 'numeric':
                            case 'decimal':
                                if (numeric_precision != null && numeric_scale != null) {
                                    colBuilder = table.decimal(column_name, numeric_precision, numeric_scale);
                                } else {
                                    colBuilder = table.decimal(column_name);
                                }
                                break;
                            case 'json':
                            case 'jsonb':
                                colBuilder = table.specificType(column_name, data_type);
                                break;
                            case 'uuid':
                                colBuilder = table.uuid(column_name);
                                break;
                            case 'bytea':
                                colBuilder = table.binary(column_name);
                                break;
                            default:
                                console.warn(`⚠️ 未识别的数据类型 "${data_type}"，使用 specificType`);
                                colBuilder = table.specificType(column_name, data_type);
                        }

                        // 设置 NOT NULL / NULL
                        if (is_nullable === 'NO') {
                            colBuilder.notNullable();
                        } else {
                            colBuilder.nullable();
                        }

                        // 如果有默认值（且并非 nextval…），就原样写入
                        if (column_default !== null) {
                            colBuilder.defaultTo(knexErp1.raw(column_default));
                        }
                    }
                }

                // 主键约束
                if (primaryKeys.length > 0) {
                    table.primary(primaryKeys);
                }
            });

            console.log(`表 ${schema}.${tableName} 已创建。`);
        }

        console.log('\n🎉 所有表结构已成功同步到 erp_1 数据库！');
    } catch (err) {
        console.error('❌ 过程出现错误：', err);
    } finally {
        // 最后关闭所有 Knex 连接
        await knexErp.destroy();
        await knexDefault.destroy();
        if (knexErp1) {
            await knexErp1.destroy();
        }
        process.exit(0);
    }
}