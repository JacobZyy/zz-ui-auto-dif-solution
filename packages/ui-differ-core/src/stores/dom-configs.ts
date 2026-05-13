import type { BoundingRect } from '../types'
import { DEFAULT_PAGE_HEIGHT, DEFAULT_PAGE_WIDTH } from '../types'

export class DomConfigs {
  private static instance: DomConfigs

  private rootNodeBounding: BoundingRect

  private constructor() {
    this.rootNodeBounding = { x: 0, y: 0, width: DEFAULT_PAGE_WIDTH, height: DEFAULT_PAGE_HEIGHT }
  }

  static getInstance(): DomConfigs {
    if (!DomConfigs.instance) {
      DomConfigs.instance = new DomConfigs()
    }
    return DomConfigs.instance
  }

  setRootBounding(viewPortSize: BoundingRect) {
    this.rootNodeBounding = viewPortSize
  }

  getRootBounding() {
    return this.rootNodeBounding
  }
}

const config = DomConfigs.getInstance()

export { config as domConfigs }
