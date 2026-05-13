import { v4 } from 'uuid'

export function getPxValue(value: string): number {
  return Number(value.replace('px', ''))
}

export function getConvertedMatrix3dValue(matrixList: string[]): string[] {
  if (matrixList.length === 16) {
    return matrixList
  }
  const [scaleX, skewY, skewX, scaleY, translateX, translateY] = matrixList

  const realMatrix = [
    [scaleX, skewY, '0', '0'],
    [skewX, scaleY, '0', '0'],
    ['0', '0', '1', '0'],
    [translateX, translateY, '0', '1'],
  ]
  return realMatrix.flat(1)
}

export function getOverrideStyleElement() {
  const targetElement = document.querySelector('style[data-override-style="true"]')
  if (!targetElement) {
    const style = document.createElement('style')
    style.setAttribute('data-override-style', 'true')
    document.head.appendChild(style)
    return style
  }
  return targetElement
}

export function changeElementStyle(options: {
  element: HTMLElement
  styleContent: string
  pseudoType?: 'before' | 'after'
}) {
  const { element, pseudoType, styleContent } = options
  const uniqueClass = `override-${pseudoType || 'current'}-${v4()}`
  element.classList.add(uniqueClass)
  const style = getOverrideStyleElement()

  const realClassKey = [uniqueClass, pseudoType].filter(Boolean).join('::')
  style.textContent += `
    .${realClassKey} {
      ${styleContent}
    }
  `
}
