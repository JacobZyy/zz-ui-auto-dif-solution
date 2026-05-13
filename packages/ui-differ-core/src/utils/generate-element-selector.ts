export function generateSelector(element: Element) {
  if (element.id) {
    return `#${element.id}`
  }

  const path = []
  let current = element

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let selector = current.nodeName.toLowerCase()

    if (current.className && typeof current.className === 'string') {
      const classes = current.className.trim().split(/\s+/).filter(c => c && !c.startsWith('devtools-'))
      if (classes.length > 0) {
        selector += `.${classes.join('.')}`
      }
    }

    if (current.parentNode) {
      const siblings = Array.from(current.parentNode.children).filter(
        sibling => sibling.nodeName === current.nodeName,
      )

      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1
        selector += `:nth-of-type(${index})`
      }
    }

    path.unshift(selector)
    current = current.parentNode as Element

    if (current && current.id) {
      path.unshift(`#${current.id}`)
      break
    }
  }

  return path.join(' > ')
}
