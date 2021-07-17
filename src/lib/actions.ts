export function onClickOutside(node: HTMLElement, cb?: () => void): { destroy(): void } {

  const dispatchOnClickOutside = (event: MouseEvent) => {
    if (node && !node.contains(event.target as Node) && !event.defaultPrevented) {
      node.dispatchEvent(new CustomEvent(`clickOutside`))
      if (cb) cb()
    }
  }

  document.addEventListener(`click`, dispatchOnClickOutside)

  return {
    destroy: () => document.removeEventListener(`click`, dispatchOnClickOutside),
  }
}
