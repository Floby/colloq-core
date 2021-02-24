import { expect } from 'chai'
import Device from '../src/Device'

describe('new Device({ keyPair, storage, circle, peers })', () => {
  it('instanciates', () => {
    // When
    const device = new Device()
    // Then
    expect(device).to.be.instanceOf(Device)
  })
  describe('.head()', () => {
    let dev: Device
    beforeEach(() => {
      dev = new Device()
    })
    it('returns the id of the message at the head of this device', () => {
      const actual = dev.head()
      expect(actual).to.be.a('string')
    })
  })
})
