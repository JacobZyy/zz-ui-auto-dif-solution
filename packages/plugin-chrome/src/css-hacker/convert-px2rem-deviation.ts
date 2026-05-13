import type { Declaration, PluginCreator, Rule } from 'postcss'
import { processRemInValue } from '@ui-differ/core'

interface Px2RemDeviationOptions {
  baseFontSize: number
}

const defaultOptions: Px2RemDeviationOptions = {
  baseFontSize: 37.5,
}

export const convertPx2RemDeviation: PluginCreator<Px2RemDeviationOptions> = (opts) => {
  const combinedOptions = { ...(opts || {}), ...defaultOptions }
  const { baseFontSize } = combinedOptions

  return {
    postcssPlugin: 'convert-px2rem-deviation',

    Rule(rule: Rule) {
      rule.walkDecls((decl: Declaration) => {
        const value = decl.value

        if (!value || !value.includes('rem')) {
          return
        }

        const newValue = processRemInValue(value, baseFontSize)
        decl.value = newValue
      })
    },
  }
}

convertPx2RemDeviation.postcss = true

export default convertPx2RemDeviation
