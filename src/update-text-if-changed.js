import { functor } from '@zambezi/fun'
import { select } from 'd3-selection'
import { selectionChanged } from '@zambezi/d3-utils'

const changed = selectionChanged()

export function updateTextIfChanged(d, i) {
  const format = d.column.format || String
      , text = functor(format(d.value))

  select(this)
      .select('.formatted-text')
      .select(changed.key(text))
        .text(text)
}
