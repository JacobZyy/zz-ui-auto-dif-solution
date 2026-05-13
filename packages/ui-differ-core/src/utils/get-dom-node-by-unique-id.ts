export function getDomNodeByUniqueId(uniqueId?: string) {
  return document.querySelector(`[unique-id="${uniqueId}"]`)
}
