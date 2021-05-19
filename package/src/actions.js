export function onClickOutside(node, cb) {
  const detectClickOutside = (event) => {
    if (node && !node.contains(event.target) && !event.defaultPrevented) {
      node.dispatchEvent(new CustomEvent(`clickOutside`, node))
      if (cb) cb()
    }
  }

  document.addEventListener(`click`, detectClickOutside)

  return {
    destroy: () => document.removeEventListener(`click`, detectClickOutside),
  }
}
