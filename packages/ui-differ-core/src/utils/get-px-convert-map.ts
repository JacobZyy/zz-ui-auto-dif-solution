class PxConvertMapSingleton {
  private static instance: PxConvertMapSingleton
  private convertMap: Map<number, number>

  private constructor() {
    this.convertMap = this.generateConvertMap()
  }

  public static getInstance(): PxConvertMapSingleton {
    if (!PxConvertMapSingleton.instance) {
      PxConvertMapSingleton.instance = new PxConvertMapSingleton()
    }
    return PxConvertMapSingleton.instance
  }

  private convertPx(originPxValue: number): number {
    const originRemValue = originPxValue / 750 * 10
    const remValue = Math.round(originRemValue * 100) / 100
    return Math.round(remValue * 37.5 * 1000) / 1000
  }

  private generateConvertMap(): Map<number, number> {
    const startValue = 1
    const endValue = 2000

    const entries = Array.from({ length: endValue - startValue + 1 }).map((_, index) => {
      const curValue = index + startValue
      if (curValue === 1) {
        return [1, 1] as const
      }

      return [this.convertPx(curValue), curValue] as const
    })

    return new Map(entries)
  }

  public getConvertMap(): Map<number, number> {
    return this.convertMap
  }
}

export function getPxConvertMap(): Map<number, number> {
  return PxConvertMapSingleton.getInstance().getConvertMap()
}
