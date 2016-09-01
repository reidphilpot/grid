import { calculateColumnLayout } from './calculate-column-layout'
import { compose, wrap } from 'underscore'
import { createBody } from './body'
import { createColumnDrag } from './column-drag'
import { createColumnSizers } from './column-sizers'
import { createEnsureColumns } from './ensure-columns'
import { createHeaders } from './headers'
import { createLayOutBodyAndOverlays } from './lay-out-body-and-overlays'
import { createMarkRowIndices } from './mark-row-indices'
import { createMeasureGridArea }  from './measure-grid-area'
import { createProcessRowData } from './process-row-data'
import { createProcessSizeAndClipping } from './process-size-and-clipping'
import { createScrollers } from './scrollers'
import { createSetupGridTemplate } from './setup-grid-template'
import { createSortRowHeaders } from './sort-row-headers'
import { createSortRows } from './sort-rows'
import { ensureData } from './ensure-data'
import { ensureId } from './ensure-id'
import { rebind, call, each, redraw, createResize, createAutoDirty, throttle } from '@zambezi/d3-utils'

import './grid.css'

export function createGrid() {

  const setupTemplate = createSetupGridTemplate()
      , ensureColumns = createEnsureColumns()
      , processRowData = createProcessRowData()
      , processSizeAndClipping = createProcessSizeAndClipping()
      , columnDrag = createColumnDrag()
      , resize = createResize()
      , columnSizers = createColumnSizers()
      , body = createBody()
      , sortRowHeaders = createSortRowHeaders()
      , autodirty = createAutoDirty()
      , grid = compose(
          call(createScrollers())
        , call(sortRowHeaders)
        , call(columnSizers)
        , call(columnDrag)
        , call(createHeaders())
        , call(body)
        , each(createLayOutBodyAndOverlays())
        , call(processSizeAndClipping)
        , call(createMeasureGridArea())
        , call(createMarkRowIndices())
        , call(createSortRows())
        , call(processRowData)
        , call(resize)
        , call(setupTemplate)
        , each(calculateColumnLayout)
        , call(ensureColumns)
        , each(ensureData)
        , each(ensureId)
        )
      , api = rebind()
            .from(columnSizers, 'resizeColumnsByDefault')
            .from(ensureColumns, 'columns')
            .from(processRowData, 'filters', 'filtersUse', 'skipRowLocking')
            .from(processSizeAndClipping, 'scroll')
            .from(resize, 'wait:resizeWait')
            .from(sortRowHeaders, 'sortableByDefault')
            .from(columnDrag, 'dragColumnsByDefault', 'acceptColumnDrop')
            .from(setupTemplate, 'template')

  return api(autodirty(redraw(throttle(grid, 10))))
}
