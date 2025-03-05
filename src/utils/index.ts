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