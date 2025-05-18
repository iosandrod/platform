export function stringToFunction<T extends (...args: any[]) => any>(
  str: string,
  params: string[] = []
): T | null {
  try {
    if (!str.trim()) {
      // throw new Error('函数字符串不能为空')
      return null
    }
    if (Boolean(str) == false) {
      return null
    }
    // 检测是否是一个箭头函数
    const isArrowFunction = str.includes('=>')

    // 直接是一个普通函数
    if (str.startsWith('function')) {
      return new Function(`return (${str})`)() as T
    }

    // 可能是箭头函数
    if (isArrowFunction) {
      return new Function(`return ${str}`)() as T
    }

    // 如果只是一个表达式，自动包装成箭头函数
    return new Function(...params, `return (${str})`) as T
  } catch (error) {
    return null
  }
}
const urlAlphabet = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
import { isArray } from 'lodash'
import { webcrypto as crypto } from 'node:crypto'
const scopedUrlAlphabet = urlAlphabet
const POOL_SIZE_MULTIPLIER = 128
let pool: any, poolOffset: any
function fillPool(bytes: any) {
  if (!pool || pool.length < bytes) {
    pool = Buffer.allocUnsafe(bytes * POOL_SIZE_MULTIPLIER)
    crypto.getRandomValues(pool)
    poolOffset = 0
  } else if (poolOffset + bytes > pool.length) {
    crypto.getRandomValues(pool)
    poolOffset = 0
  }
  poolOffset += bytes
}
export function random(bytes: number) {
  fillPool((bytes |= 0))
  return pool.subarray(poolOffset - bytes, poolOffset)
}
export function customRandom(
  alphabet: string | any[],
  defaultSize: number,
  getRandom: { (bytes: any): any; (arg0: number): any }
) {
  let mask = (2 << (31 - Math.clz32((alphabet.length - 1) | 1))) - 1
  let step = Math.ceil((1.6 * mask * defaultSize) / alphabet.length)
  return (size = defaultSize) => {
    let id = ''
    while (true) {
      let bytes = getRandom(step)
      let i = step
      while (i--) {
        id += alphabet[bytes[i] & mask] || ''
        if (id.length >= size) return id
      }
    }
  }
}
export function customAlphabet(alphabet: any, size = 21) {
  return customRandom(alphabet, size, random)
}
export function nanoid(size = 21) {
  fillPool((size |= 0))
  let id = ''
  for (let i = poolOffset - size; i < poolOffset; i++) {
    id += scopedUrlAlphabet[pool[i] & 63]
  }
  return id
}

export function formatTableColumn(columns: any[]) {
  //
}

export const createNodeGrid = (field: string, _this: any) => {
  let _node = {
    ..._this.createIdKey('inline'),
    columns: [
      {
        ..._this.createIdKey('grid'),
        options: {
          gutter: 0,
          justify: 'start',
          align: 'top'
        },
        style: {
          width: '100%'
        },
        columns: [
          {
            ..._this.createIdKey('col'), //
            // list: [_.cloneDeep(node)],
            list: [
              {
                ..._this.createIdKey('inline'),
                columns: [field]
              }
            ],
            options: {
              span: 24,
              offset: 0,
              push: 0,
              pull: 0,
              style: {}
            }
          }
        ]
      }
    ]
  }
  return _node
}

//cols2是数据库的
export const mergeCols = (cols1: any, cols2: any, isMain: boolean = false) => {
  if (Array.isArray(cols1) && isArray(cols2)) {
    for (const col1 of cols1) {
      let tCol = cols2.find((col: any) => {
        let field = col.field
        return field == col1.field
      })
      if (tCol != null) {
        let field = tCol.field
        if (col1.title == col1.field) {
          //
          col1.title = tCol.title || tCol.field ////
        } else {
          col1.title = tCol.title || col1.title //
        }
        Object.entries(tCol).forEach(([k, v]) => {
          let ov = col1[k] //
          if (ov == null || ['type'].includes(k)) {
            col1[k] = v //
          }
        })
        col1['id'] = tCol['id'] //
      }
    }
    if (isMain) {//
      let _f = cols1.map(c => c.field)
      let addCols = cols2.filter(col => {
        let f = col.field
        if (!_f.includes(f)) {
          return true
        }
      })//
      cols1.push(...addCols)//
    }//
  }//
}
