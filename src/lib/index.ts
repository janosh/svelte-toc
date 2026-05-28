export { default, default as Toc } from './Toc.svelte'

export type CollapseMode = boolean | `h${2 | 3 | 4 | 5 | 6}`
export type OpenChangeTrigger =
  | `button`
  | `escape`
  | `outside-click`
  | `programmatic`
  | `tab`
  | `toc-item`
export type OpenChangeEvent = {
  open: boolean
  desktop: boolean
  trigger: OpenChangeTrigger
}
export type OpenChangeHandler = (event: OpenChangeEvent) => void

export type TocHeadingData = { id: string; level: number; title: string }
