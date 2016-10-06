import { fromDetail } from '@zambezi/d3-utils'
import { isNumber, clone } from 'underscore'
import { select } from 'd3-selection'

const minDefaultColumnWidth = 35
    , clippingTolerance = 0.5

export function createProcessSizeAndClipping() {
  let scroll = { top: 0, left: 0 }

  function processSizeAndClipping(s) {
    s.each(processSizeAndClippingEach)
  }

  processSizeAndClipping.scroll = function(value) {
    if (!arguments.length) return scroll
    scroll = value
    return processSizeAndClipping
  }

  return processSizeAndClipping

  function processSizeAndClippingEach(d) {
    let {
          bodyBounds
        , rowHeight
        , rows
        , columns
        , scrollerWidth
        } = d
      , clippedVertical
      , clippedHorizontal
      , availableFreeHeight
      , availableFreeWidth
      , root = select(this)

    root.on('grid-scroll.size-and-clipping', fromDetail(onGridScroll))

    measureBlocks()
    calculateVerticalClipping()
    setColumnWidths()
    layoutColumnBlocks()
    calculateHorizontalClipping()
    calculateVerticalClipping()   // confirm after horizontal clipping
    validateScroll()
    updateScroll()
    calculateActualSizeForFreeBlocks()
    updateBoundsClipping()

    function calculateVerticalClipping() {
      availableFreeHeight =
          bodyBounds.height
        - rows.top.measuredHeight
        - rows.bottom.measuredHeight
        - (clippedHorizontal ? scrollerWidth : 0)

      clippedVertical = availableFreeHeight
        - rows.free.measuredHeight <-clippingTolerance
    }

    function calculateHorizontalClipping() {
      availableFreeWidth = bodyBounds.width
        - columns.left.measuredWidth
        - columns.right.measuredWidth
        - (clippedVertical ? scrollerWidth : 0)

      clippedHorizontal = availableFreeWidth
        - columns.free.measuredWidth < -clippingTolerance
    }

    function setColumnWidths() {
      var leafColumns = columns.leafColumns
        , definedWidths = columns.leafColumns
              .reduce(findDefinedWidths, { cols: 0, sum: 0 })
        , availableWidth = bodyBounds.width
              - (clippedVertical ? scrollerWidth : 0)
              - definedWidths.sum
        , undefinedColumnCount = leafColumns.length - definedWidths.cols
        , defaultWidth = Math.max(
            availableWidth / undefinedColumnCount
          , minDefaultColumnWidth
          )

      leafColumns.forEach(updateLeafColumnWidths)
      columns.forEach(updateGroupColumnWidths)

      function updateLeafColumnWidths(column) {
        if (isNumber(column.width)) return
        column.width = defaultWidth
      }

      function updateGroupColumnWidths(column) {
        const children = column.children
        if (!children) return
        column.width = children.reduce(sumColumnWidth, 0)
      }
    }

    function validateScroll() {
      scroll.top = Math.max(
        0
      , Math.min(
          rows.free.measuredHeight - availableFreeHeight
        , scroll.top
        )
      )
      scroll.left = Math.max(
        0
      , Math.min(
          scroll.left
        , columns.free.measuredWidth - availableFreeWidth
        )
      )
    }

    function measureBlocks() {
      ;[rows.top, rows.bottom, rows.free].forEach(measureBlock)
    }

    function layoutColumnBlocks() {
      ;[columns.left, columns.right, columns.free]
          .forEach(layOutColumnBlockWithOffset(0))
    }

    function measureBlock(block) {
      block.measuredHeight = block.length * rowHeight
    }

    function calculateActualSizeForFreeBlocks() {
      var actualFreeHeight = bodyBounds.height
              - rows.top.measuredHeight
              - rows.bottom.measuredHeight
              - (clippedHorizontal ? scrollerWidth : 0)
        , actualFreeWidth =  bodyBounds.width
              - columns.left.measuredWidth
              - columns.right.measuredWidth
              - (clippedVertical ? scrollerWidth : 0)
        , verticalDifference = scroll.top
              + actualFreeHeight
              - rows.free.measuredHeight
        , horizontalDifference = scroll.left
              + actualFreeWidth
              - columns.free.measuredWidth

      columns.free.actualWidth = actualFreeWidth
      columns.free.isScrolledLeft = !!scroll.left
      columns.free.isScrolledRight = horizontalDifference < -clippingTolerance
      columns.right.isHorizontalShort = horizontalDifference > clippingTolerance

      rows.free.actualHeight = actualFreeHeight
      rows.free.isScrolledTop = !!scroll.top
      rows.free.isScrolledBottom = verticalDifference < 0
      rows.bottom.isVerticalShort = verticalDifference > 0
    }

    function updateScroll() {
      d.scroll = clone(scroll)
    }

    function updateBoundsClipping() {
      bodyBounds.clippedVertical = clippedVertical
      bodyBounds.clippedHorizontal = clippedHorizontal
    }


    function onGridScroll(d) {
      scroll = d
      scroll.changed =  new Date().toString()
    }
  }

  function findDefinedWidths(p, c) {
    if (isNumber(c.width) || c.hidden) {
      p.sum += c.hidden ? 0 : c.width
      p.cols++
    }
    return p
  }

  function sumColumnWidth(p, c) {
    if (c.hidden) return p
    return p + c.width
  }

  function layOutColumnBlockWithOffset(offset) {
    return function layOutBlockEach(block) {
      let measuredWidth = 0
      block.forEach(layOutColumn)
      block.measuredWidth = measuredWidth
      block.leafColumns = block.reduce(findLeafColumns, [])
      function layOutColumn(column) {
        if (column.hidden) return
        column.offset = measuredWidth
        column.absoluteOffset = offset + measuredWidth
        measuredWidth += column.width
        if (!column.children) return
        layOutColumnBlockWithOffset(column.offset)(column.children)
      }
    }
  }

  function findLeafColumns(p, c) {
    return p.concat(c.children || c)
  }
}
