/** 工具类型：用于判断两个类型是否完全相等 */
export type IfEquals<X, Y, A = X, B = never>
  = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? A : B

/** 工具类型：提取对象类型中所有可写（非只读）的属性键 */
export type WritableKeys<T> = {
  [P in keyof T]-?: IfEquals<
    { [Q in P]: T[P] },
    { -readonly [Q in P]: T[P] },
    P,
    never
  >
}[keyof T]

/** 工具类型：从对象类型中提取类型为 string 的可写属性键 */
export type WritableStringKeys<T> = {
  [K in WritableKeys<T>]: T[K] extends string ? K : never
}[WritableKeys<T>]
