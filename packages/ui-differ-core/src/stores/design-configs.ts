import { SafeTopAreaType } from '../types'

export class DesignConfigs {
  private static instance: DesignConfigs
  safeTopHeight: number
  safeBottomHeight: number
  convertPxTrigger: boolean
  safeTopAreaType: SafeTopAreaType

  setSafeTopHeight(value: number): void {
    this.safeTopHeight = value
  }

  getSafeTopHeight(): number {
    return this.safeTopHeight
  }

  setSafeBottomHeight(value: number): void {
    this.safeBottomHeight = value
  }

  getSafeBottomHeight(): number {
    return this.safeBottomHeight
  }

  setConvertPxTrigger(value: boolean): void {
    this.convertPxTrigger = value
  }

  getConvertPxTrigger(): boolean {
    return this.convertPxTrigger
  }

  setSafeTopType(value: SafeTopAreaType): void {
    console.log('🚀 ~ DesignConfigs ~ setSafeTopType ~ SafeTopAreaType:', SafeTopAreaType)
    this.safeTopAreaType = value
  }

  getSafeTopType(): SafeTopAreaType {
    return this.safeTopAreaType
  }

  private constructor() {
    this.safeTopHeight = 0
    this.safeBottomHeight = 0
    this.convertPxTrigger = true
    this.safeTopAreaType = SafeTopAreaType.STATUS_BANNER
  }

  static getInstance(): DesignConfigs {
    if (!DesignConfigs.instance) {
      DesignConfigs.instance = new DesignConfigs()
    }
    return DesignConfigs.instance
  }
}

const config = DesignConfigs.getInstance()

export { config as designConfigs }
