import { describe, it, expect } from 'vitest'

import { describeVillainRange } from './range-summary'

describe('describeVillainRange', () => {
  it('describes SRP node correctly', () => {
    const result = describeVillainRange(
      { potType: 'srp', opener: 'BTN', caller: 'BB' },
      77,
    )
    expect(result).toBe("BB's calling range vs BTN open (77 hands)")
  })

  it('describes 3-bet node correctly', () => {
    const result = describeVillainRange(
      { potType: '3bet', opener: 'BTN', threeBettor: 'BB', caller: 'BTN' },
      38,
    )
    expect(result).toBe("BTN's calling range vs BB 3-bet (38 hands)")
  })
})
