const SortedJsonStringify = require('json.sortify')
import { createHash } from 'crypto'

export type Stitch = { [key: string]: any }
export type StitchId = string & { __is_stitch_id: void }

export default class Strand {
  #needle?: StitchId
  #stitches = new Map<StitchId, Stitch>()

  needle (): StitchId | void {
    return this.#needle
  }

  stitch (content: Stitch): StitchId {
    const stitch = {
      ...content,
      ...( this.#needle ?  { p: this.#needle } : {})
    }
    const id = StitchId(stitch)
    this.#stitches.set(id, stitch)
    this.#needle = id
    return id
  }

  get (id: StitchId): Stitch | void {
    return this.#stitches.get(id)
  }

  async *walk (from?: StitchId, limit: number=Infinity, until?: StitchId): AsyncGenerator<Stitch> {
    let currentStitch = from || this.needle()
    let count = 0
    while (currentStitch !== undefined && currentStitch !== until && count < limit) {
      const stitch = this.get(currentStitch) as Stitch
      yield stitch
      ++count
      currentStitch = stitch.p
    }
  }
}

function StitchId (s: Stitch): StitchId {
  const json = SortedJsonStringify(s)
  const hash = createHash('sha1')
  hash.update(json)
  return hash.digest('hex') as StitchId
}
