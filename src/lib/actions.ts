export function onClickOutside(node: Element, cb?: () => void): { destroy: () => void } {

  const dispatchOnClickOutside = (event: Event) => {
    if (node && !node.contains(event.target as Element) && !event.defaultPrevented) {
      node.dispatchEvent(new CustomEvent(`clickOutside`))
      if (cb) cb()
    }
  }

  document.addEventListener(`click`, dispatchOnClickOutside)

  return {
    destroy: () => document.removeEventListener(`click`, dispatchOnClickOutside),
  }
}
