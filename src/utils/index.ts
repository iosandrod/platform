export function stringToFunction<T extends (...args: any[]) => any>(
  str: string,
  params: string[] = []
): T | null {
  try {
    if (!str.trim()) {
      throw new Error("函数字符串不能为空");
    }

    // 检测是否是一个箭头函数
    const isArrowFunction = str.includes("=>");

    // 直接是一个普通函数
    if (str.startsWith("function")) {
      return new Function(`return (${str})`)() as T;
    }

    // 可能是箭头函数
    if (isArrowFunction) {
      return new Function(`return ${str}`)() as T;
    }

    // 如果只是一个表达式，自动包装成箭头函数
    return new Function(...params, `return (${str})`) as T;
  } catch (error) {
    console.error("解析函数出错:", error);
    return null;
  }
}
const urlAlphabet =
  'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
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
export function customRandom(alphabet: string | any[], defaultSize: number, getRandom: { (bytes: any): any; (arg0: number): any; }) {
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


export function formatTableColumn(columns: any[]) {//

}