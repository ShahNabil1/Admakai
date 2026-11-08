import { describe, it, expect } from 'vitest';
import { passportFileError, passportJpegDimensions, PASSPORT_WIDTH, PASSPORT_HEIGHT } from './passport-rules';
describe('Passport photo requirements', () => {
  it('rejects images over 5 MB', () => { expect(passportFileError({size:5242881,type:'image/jpeg'})).not.toBeNull(); expect(passportFileError({size:5242880,type:'image/jpeg'})).toBeNull(); });
  it('rejects non-image files', () => expect(passportFileError({size:100,type:'application/pdf'})).not.toBeNull());
  it('requires 700 by 900 output', () => { expect(PASSPORT_WIDTH).toBe(700); expect(PASSPORT_HEIGHT).toBe(900); });
  it('reads real JPEG frame dimensions and rejects other headers', () => { expect(passportJpegDimensions(new Uint8Array([255,216,255,192,0,17,8,3,132,2,188,3,1,0,0]))).toEqual({width:700,height:900}); expect(passportJpegDimensions(new Uint8Array([137,80,78,71]))).toBeNull(); });
});