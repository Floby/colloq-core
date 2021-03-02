const SortedJsonStringify = require('json.sortify')
import {createHash} from 'crypto'
import { expect } from 'chai'
import Strand, { Stitch, StitchId } from '../src/Strand'

describe('new Strand()', () => {
  let strand: Strand
  beforeEach(() => {
    strand = new Strand()
  })
  it('instanciates', async () => {
    // Then
    expect(strand).to.be.an.instanceOf(Strand)
  })
  context('when empty', () => {
    describe('.needle()', () => {
      it('returns undefined', async () => {
        // Given
        // When
        const actual = strand.needle()
        // Then
        expect(actual).to.equal(undefined)
      })
    })
    describe('.get(stitchId)', () => {
      it('returns undefined', () => {
        const actual = strand.get('e8f67b1ad9773cb9096ca0d6c696156e72c76aa4' as StitchId)
        expect(actual).to.equal(undefined)
      })
    })
    describe('.stitch(stitch)', () => {
      it("returns the hash of the object", async () => {
        // given
        const stitch = { type: 'knot', v: 0 }
        const expected = sha1(JSON.stringify(stitch))
        // when
        const actual = strand.stitch(stitch)
        // then
        expect(actual).to.equal(expected)
      })
      it("returns the hash of the object regardless of key order", async () => {
        // given
        const stitch = { v: 0, type: 'knot' }
        const expected = sha1(JSON.stringify({ type: 'knot', v: 0 }))
        // when
        const actual = strand.stitch(stitch)
        // then
        expect(actual).to.equal(expected)
      })
      context('then', () => {
        let stitchId: StitchId
        beforeEach(() => {
          stitchId = strand.stitch({ v: 0, type: 'knot' })
        })
        describe('.needle()', () => {
          it('returns the new StitchId', () => {
            expect(strand.needle()).to.equal(stitchId)
          })
        })
        describe('.get(stichId)', () => {
          it('returns the stitch content', () => {
            const actual = strand.get(stitchId)
            expect(actual).to.deep.equal({v: 0, type: 'knot'})
          })
        })
      })
    })
  })

  context('when a stitch is already stitched', () => {
    let needle: StitchId
    beforeEach(() => {
      strand.stitch({ v:0, type: 'knot' })
      const currentNeedle = strand.needle()
      if (currentNeedle) needle = currentNeedle
    })
    describe('.stitch(stitch)', () => {
      const stitch = { v:0, type: 'msg', msg: 'Hello World!' }
      let stitchId: StitchId
      beforeEach(() => {
        stitchId = strand.stitch(stitch)
      })
      it('returns a different stitchId', () => {
        // Then
        expect(stitchId).not.to.equal(needle)
      })
      context('then', () => {
        describe('.needle()', () => {
          it('returns the new stitchId', () => {
            expect(strand.needle()).to.equal(stitchId)
          })
        })
        describe('.get(stitchId)', () => {
          it('returns the content of the stitch with an extra `p` key', () => {
            const actual = strand.get(stitchId) as Stitch
            const { p, ...content } = actual as Stitch
            expect(content).to.deep.equal(stitch)
          })
          it('has the StitchId of the previous needle in its `p` key', () => {
            const actual = strand.get(stitchId) as Stitch
            const { p } = actual as Stitch
            expect(p).to.deep.equal(needle)
          })
          it('returns the content of which the hash is the key', () => {
            const actual = strand.get(stitchId) as Stitch
            expect(sha1(SortedJsonStringify(actual))).to.equal(stitchId)
          })
        })
      })
    })
  })

  context('when a few stitches are stitched', () => {
    const stitches = [
      { v:0, type: 'knot' },
      { v:0, type: 'msg', msg: 'Hello, World!'},
      { v:0, type: 'msg', msg: 'Bonjour tout le monde !'},
      { v:0, type: 'msg', msg: 'Hallo, Welt!'},
    ]
    let stitchIds: Array<StitchId|void> = []
    beforeEach(() => {
      stitchIds = stitches.map((stitch) => strand.stitch(stitch))
    })
    describe('.walk()', () => {
      it('returns an async iterator of all the stitches from the needle to the knot', async () => {
        // Given
        const expected = [...stitches].reverse()
        const expectedIds = [...stitchIds].reverse().slice(1).concat([undefined])
        // When
        const actual = await toArray(strand.walk())
        // Then
        const contents = actual.map(({ p, ...content }) => content)
        const ids = actual.map(({ p }) => p)
        expect(contents).to.deep.equal(expected)
        expect(ids).to.deep.equal(expectedIds)
      })
    })
    describe('.walk(from)', () => {
      it('returns an async iterator of all the stitches from the given stitch to the knot', async () => {
        // Given
        const from = stitchIds[2] as StitchId
        const expected = [...stitches].reverse().slice(1)
        const expectedIds = [...stitchIds].reverse().slice(1).concat([undefined]).slice(1)
        // When
        const actual = await toArray(strand.walk(from))
        // Then
        const contents = actual.map(({ p, ...content }) => content)
        const ids = actual.map(({ p }) => p)
        expect(contents).to.deep.equal(expected)
        expect(ids).to.deep.equal(expectedIds)
      })
    })
    describe('.walk(undefined, limit)', () => {
      it('returns an async iterator of all the stitches of max length limit', async () => {
        // Given
        const limit = 2
        const expected = [...stitches].reverse().slice(0, limit)
        const expectedIds = [...stitchIds].reverse().slice(1).concat([undefined]).slice(0, limit)
        // When
        const actual = await toArray(strand.walk(undefined, limit))
        // Then
        const contents = actual.map(({ p, ...content }) => content)
        const ids = actual.map(({ p }) => p)
        expect(contents).to.deep.equal(expected)
        expect(ids).to.deep.equal(expectedIds)
      })
    })
    describe('.walk(undefined, limit, until)', () => {
      it('returns an async iterator of all the stitches until the one given', async () => {
        // Given
        const until = stitchIds[1] as StitchId
        const expected = [...stitches].reverse().slice(0, 2)
        const expectedIds = [...stitchIds].reverse().slice(1).concat([undefined]).slice(0, 2)
        // When
        const actual = await toArray(strand.walk(undefined, Infinity, until))
        // Then
        const contents = actual.map(({ p, ...content }) => content)
        const ids = actual.map(({ p }) => p)
        expect(contents).to.deep.equal(expected)
        expect(ids).to.deep.equal(expectedIds)
      })
    })
  })
})

function sha1 (content: string) {
  const hash = createHash("sha1")
  hash.update(content)
  return hash.digest().toString('hex')
}

async function toArray<T> (iterator: AsyncGenerator<T>): Promise<Array<T>> {
    const arr: T[] = []
    for await(const i of iterator) {
      arr.push(i)
    }
    return arr
}
