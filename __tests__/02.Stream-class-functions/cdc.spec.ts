import initStream from './init-stream';
import { Stream } from '../../src/Stream';
import { Nullable, TEventRecord } from '../../src/interfaces';

let stream: Stream;

const convertToDbRecord = (item: Nullable<TEventRecord>) => {
  const { tradeno, tradetime, orderno, shortname, seccode, buysell } = item || {};
  return {
    tradeno: String(tradeno),
    tradetime: (new Date(tradetime)).toISOString(),
    orderno: String(orderno),
    shortname,
    seccode,
    buysell,
  };
};

const convertRecordsToExpected = (arr: TEventRecord[]) => arr.map(convertToDbRecord);

describe('Test CDC', () => {
  beforeAll(async () => {
    stream = await initStream();
  });

  describe('case1', () => {
    let portions: any[];
    let expected: any[];
    let ltr: any[];
    beforeAll(() => {
      portions = [
        require('./case1/0-data.json'),
        require('./case1/1-data.json'),
        require('./case1/2-data.json'),
      ];
      expected = [
        [],
        require('./case1/1-expected.json'),
        require('./case1/2-expected.json'),
      ];
      ltr = [
        require('./case1/0-data-ltr.json'),
        require('./case1/1-data-ltr.json'),
        require('./case1/2-data-ltr.json'),
      ];
    });
    test('test 1', () => {
      stream._addPortionToBuffer(portions[0]);
      const [first, , , last] = portions[0];

      expect(stream.lastRecordTs).toEqual(+(new Date(last.tradetime)));

      const lastTimeRecords = stream.lastTimeRecords.getLtr();
      expect(lastTimeRecords).toMatchObject(ltr[0]);

      expect(convertToDbRecord(stream.recordsBuffer.first)).toEqual(first);
      expect(convertToDbRecord(stream.recordsBuffer.last)).toEqual(last);

      const resBuffer = convertRecordsToExpected(stream.recordsBuffer.buffer);
      expect(resBuffer).toEqual(portions[0]);
    });

    test('test 2', () => {
      stream._addPortionToBuffer(portions[1]);
      const last = portions[1][6];

      expect(stream.lastRecordTs).toEqual(+(new Date(last.tradetime)));

      const lastTimeRecords = stream.lastTimeRecords.getLtr();
      expect(lastTimeRecords).toEqual(ltr[1]);

      expect(convertToDbRecord(stream.recordsBuffer.first)).toEqual(portions[0][0]);
      expect(convertToDbRecord(stream.recordsBuffer.last)).toEqual(last);

      const resBuffer = convertRecordsToExpected(stream.recordsBuffer.buffer);
      expect(resBuffer).toEqual(expected[1]);
    });

    test('test 3', () => {
      stream._addPortionToBuffer(portions[2]);
      const last = portions[2][4];

      expect(stream.lastRecordTs).toEqual(+(new Date(last.tradetime)));

      const lastTimeRecords = stream.lastTimeRecords.getLtr();
      expect(lastTimeRecords).toEqual(ltr[2]);

      expect(convertToDbRecord(stream.recordsBuffer.first)).toEqual(portions[0][0]);
      expect(convertToDbRecord(stream.recordsBuffer.last)).toEqual(last);

      const resBuffer = convertRecordsToExpected(stream.recordsBuffer.buffer);
      expect(resBuffer).toEqual(expected[2]);
    });
  });

  describe('case2', () => {
    test('test 1', () => {
      const portions = [
        require('./case2/0-data.json'),
        require('./case2/1-data.json'),
        require('./case2/2-data.json'),
      ];
      const expected = require('./case2/2-expected.json');
      stream.recordsBuffer.flush();
      stream._addPortionToBuffer(portions[0]);
      stream._addPortionToBuffer(portions[1]);
      stream._addPortionToBuffer(portions[2]);
      const resBuffer = convertRecordsToExpected(stream.recordsBuffer.buffer);
      expect(resBuffer).toEqual(expected);
    });
  });

  describe('case3', () => {
    let portions: any[];
    let expected: any[];
    let ltr: any[];
    let resBuffer;
    beforeAll(() => {
      portions = [
        require('./case3/0-data.json'),
        require('./case3/1-data.json'),
        require('./case3/2-data.json'),
        require('./case3/3-data.json'),
      ];
      expected = [
        portions[0],
        portions[0],
        require('./case3/2-expected.json'),
        require('./case3/3-expected.json'),
      ];
      ltr = [
        require('./case3/0-data-ltr.json'),
        require('./case3/1-data-ltr.json'),
        require('./case3/2-data-ltr.json'),
        require('./case3/3-data-ltr.json'),
      ];
      stream.recordsBuffer.flush();
    });

    test('test 0', () => {
      stream._addPortionToBuffer(portions[0]);
      expect(stream.lastTimeRecords.getLtr()).toEqual(ltr[0]);

      resBuffer = convertRecordsToExpected(stream.recordsBuffer.buffer);
      expect(resBuffer).toEqual(expected[0]);
    });

    test('test 1', () => {
      stream._addPortionToBuffer(portions[1]);
      expect(stream.lastTimeRecords.getLtr()).toEqual(ltr[1]);

      resBuffer = convertRecordsToExpected(stream.recordsBuffer.buffer);
      expect(resBuffer).toEqual(expected[1]);
    });

    test('test 2', () => {
      stream._addPortionToBuffer(portions[2]);
      expect(stream.lastTimeRecords.getLtr()).toEqual(ltr[2]);

      resBuffer = convertRecordsToExpected(stream.recordsBuffer.buffer);
      expect(resBuffer).toEqual(expected[2]);
    });

    test('test 3', () => {
      stream._addPortionToBuffer(portions[3]);
      expect(stream.lastTimeRecords.getLtr()).toEqual(ltr[3]);

      resBuffer = convertRecordsToExpected(stream.recordsBuffer.buffer);
      expect(resBuffer).toEqual(expected[3]);
    });
  });
});
