import * as os from 'os';
import * as crypto from 'crypto';
import { ToISOTimeOptions } from 'luxon/src/datetime';
import { DateTime } from 'luxon';

let instanceKey: string;

export const getInstanceKey = () => {
  if (!instanceKey) {
    const data = `${os.hostname()}${__dirname}${process.env.NODE_CONFIG_ENV || process.env.NODE_ENV}`;
    instanceKey = crypto.createHash('md5').update(data).digest('hex');
  }
  return instanceKey;
};

export const getStreamKey = (stringId: string) => getInstanceKey() + stringId;

export const padR = (str: any, strLength: number, padSymbol: string = ' ') => {
  str = String(str || '');
  if (str.length < strLength) {
    str += padSymbol.repeat(Math.min(Math.max(0, strLength - str.length), 10000));
  }
  return str;
};

export const padL = (str: any, strLength: number, padSymbol: string = ' ') => {
  str = String(str == null ? '' : str);
  if (str.length < strLength) {
    str = padSymbol.repeat(Math.min(Math.max(0, strLength - str.length), 10000)) + str;
  }
  return str;
};

export const sleep = async (timeOut: number) => new Promise((resolve) => {
  setTimeout(resolve, timeOut);
});

export const timeParamRE = /^(\d+)\s*(years?|y|months?|mo|weeks?|w|days?|d|hours?|h|minutes?|min|m|seconds?|sec|s|milliseconds?|millis|ms|)$/i;

export const getTimeParamMillis = (val: string | number): number => {
  const [, nn, dhms] = timeParamRE.exec(String(val) || '') || [];
  if (!nn) {
    return 0;
  }
  let sec = 0;

  switch (dhms.toLowerCase()) {
    case 'y':
    case 'year':
    case 'years':
      sec = 365 * 24 * 3600 * +nn;
      break;
    case 'mo':
    case 'month':
    case 'months':
      sec = 30 * 24 * 3600 * +nn;
      break;
    case 'w':
    case 'week':
    case 'weeks':
      sec = 7 * 24 * 3600 * +nn;
      break;
    case 'd':
    case 'day':
    case 'days':
      sec = 24 * 3600 * +nn;
      break;
    case 'h':
    case 'hour':
    case 'hours':
      sec = 3600 * +nn;
      break;
    case 'm':
    case 'min':
    case 'minute':
    case 'minutes':
      sec = 60 * +nn;
      break;
    case 's':
    case 'sec':
    case 'second':
    case 'seconds':
      sec = +nn;
      break;
    case 'ms':
    case 'millis':
    case 'millisecond':
    case 'milliseconds':
      return +nn;
    default:
      return +nn;
  }
  return sec * 1000;
};

// 2022-05-15T16:56:42.349Z
export const millis2isoZ = (millis: number, options?: ToISOTimeOptions): string => DateTime.fromMillis(millis).setZone('UTC').toISO(options);

// 2022-05-15T19:56:42.349+03:00
export const millis2iso = (millis: number, options?: ToISOTimeOptions): string => DateTime.fromMillis(millis).toISO(options);

/*
export const getBool = (v: any): boolean => {
  if (typeof v === 'string') {
    return /^(true|1|yes)$/i.test(v);
  }
  return !!v;
};
*/
