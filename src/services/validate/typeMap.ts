import { Type } from '@sinclair/typebox' //
export const typeMap: Record<string, any> = {
  // 🔢 数值类型
  smallint: Type.Integer({ minimum: -32768, maximum: 32767 }), // 2字节
  integer: Type.Integer({ minimum: -2147483648, maximum: 2147483647 }), // 4字节
  bigint: Type.Integer({ minimum: Number.MIN_SAFE_INTEGER, maximum: Number.MAX_SAFE_INTEGER }), // 8字节
  decimal: Type.Number(), // 精确浮点数
  numeric: Type.Number(), // 精确浮点数
  real: Type.Number(), // 4字节浮点数
  'double precision': Type.Number(), // 8字节浮点数

  // 📝 字符串类型
  char: (length = 1) => Type.String({ minLength: length, maxLength: length }), // 固定长度
  varchar: (length = 255) => Type.String({ maxLength: length }), // 可变长度
  text: Type.String(), // 无限长度文本

  // ✅ 布尔类型
  boolean: Type.Boolean(),

  // 📅 日期/时间类型
  date: Type.String({ format: 'date' }), // YYYY-MM-DD
  timestamp: Type.String({ format: 'date-time' }), // ISO 8601 时间格式
  'timestamp without time zone': Type.String({ format: 'date-time' }),
  'timestamp with time zone': Type.String({ format: 'date-time' }),

  // 📦 JSON 类型
  json: Type.Record(Type.String(), Type.Any()), // 任意 JSON 对象
  jsonb: Type.Record(Type.String(), Type.Any()), // JSONB 结构化数据

  // 🏷️ UUID 类型
  uuid: Type.String({ format: 'uuid' }),

  // 📂 二进制数据
  bytea: Type.String(), // Base64 编码的二进制数据

  // 📡 网络地址
  inet: Type.String(), // IPv4 或 IPv6
  cidr: Type.String(), // CIDR 格式网络地址
  macaddr: Type.String(), // MAC 地址

  // ⏳ 时间间隔
  interval: Type.String() // ISO 8601 时间间隔
}
