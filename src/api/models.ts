import {
  CoordsDisplay,
  decDegToDms,
  decDegToDmsStrings,
  degAsDms,
  sanitize,
  secondsToHMS,
  smartCastFloat,
  zeroPad,
} from "./converters";
import { AstroLngs, RiseSetGroup } from "./interfaces";
import { JulDate, localOffsetSecs, unixTimeToJulDate } from "./julian-date";
import { KeyName, KeyNameValue } from "./mappings";
import { bodies } from "./options";
import { isNumeric, notEmptyString, zeroPad2 } from "./utils";

export interface KeyNumValue {
  key: string;
  num?: number;
  value: number;
}

export interface KeyNumName {
  key: string;
  name: string;
  value: number;
}

export interface GeoCoords {
  lat: number;
  lng: number;
  alt?: number;
}

export class GeoLoc implements GeoCoords {
  lat = 0;

  lng = 0;

  alt = 0;

  constructor(inData: any = null) {
    if (inData instanceof Object) {
      Object.entries(inData).forEach(([key, val]) => {
        if (isNumeric(val)) {
          const flVal = smartCastFloat(val);
          switch (key) {
            case "lat":
            case "latitude":
              this.lat = flVal;
              break;
            case "lng":
            case "long":
            case "longitude":
              this.lng = flVal;
              break;
            case "alt":
            case "altitude":
              this.alt = flVal;
              break;
          }
        }
      });
    }
  }

  toString(): string {
    const parts = [this.lat, this.lng];
    if (this.alt > 5 || this.alt < -5) {
      parts.push(Math.round(this.alt));
    }
    return parts.join(",");
  }
  
  toDisplay(): string {
    const parts = [degAsDms(this.lat, 'lat'), degAsDms(this.lng, 'lng')];
    return parts.join(", ");
  }
}

export const latLngToLocString = (lat = 0, lng = 0) => {
  return new GeoLoc({ lat, lng }).toString();
};

export interface UnixTimeRange {
  start: number;
  end?: number;
  hasEnd: boolean;
}

export class GeoName {
  name ='';
  toponym ='';
  fcode = 'XXX';
  lat = 0;
  lng = 0;

  constructor(inData: any = null) {
    if (inData instanceof Object) {
      const { name, toponym, fcode, lat, lng } = inData;
      if (typeof toponym === 'string') {
        this.toponym = toponym;
      }
      if (typeof name === 'string') {
        this.name = name;
      }
      if (typeof fcode === 'string') {
        this.fcode = fcode.toUpperCase();
      }
      if (typeof lat === 'number') {
        this.lat = lat;
      }
      if (typeof lng === 'number') {
        this.lng = lng;
      }
    }
  }

  get isValid() {
    return notEmptyString(this.name);
  }

  get isCountry() {
    return this.fcode.startsWith('PC') && this.name.length === 2;
  }

  get isAdmin() {
    return this.fcode.startsWith('ADM') && this.name.length > 0;
  }

  get locality() {
    return !this.isAdmin && !this.isCountry;
  }

}

export class PlaceInfo {
  cc = '';
  locality = '';
  adminName = '';
  region = '';
  countryName = '';
  lat = 0;
  lng = 0;
  zoneName = '';
  hasSetCoords = false;

  constructor(place: any = null) {
    if (place instanceof Object) {
      const { lat, lng, name, adminName, region, cc, countryName, zoneName, text } = place;
      if (typeof lat === 'number') {
        this.lat = lat;
        if (typeof lng === 'number') {
          this.lng = lng;
          this.hasSetCoords = true;
        }
      }
      if (notEmptyString(name)) {
        this.locality = name;
      } else if (notEmptyString(text)) {
        const parts = text.split(",");
        this.locality = parts[0];
        if (parts.length > 1) {
          const subParts = parts[1].split("(");
          this.adminName = subParts[0].trim();
          if (subParts.length > 1) {
            this.cc = subParts[1].replace(')', '');
            this.countryName = this.cc;
          }
        }
      }
      if (notEmptyString(adminName)) {
        this.adminName = adminName;
      }
      if (notEmptyString(region)) {
        this.region = region;
      }
      if (notEmptyString(cc)) {
        this.cc = cc;
      }
      if (notEmptyString(zoneName)) {
        this.zoneName = zoneName;
      }
      if (notEmptyString(countryName)) {
        switch (this.cc) {
          case 'GB':
          case 'UK':
            if (notEmptyString(this.region) && /(Wales|land)$/.test(this.region)) {
              this.countryName = this.region;
            }
            break;
          default:
            this.countryName = countryName;
            break;
        }
      }
    }
  }

  get hasContent() {
    return notEmptyString(this.locality) && this.hasSetCoords;
  }

  get hasAdmin(): boolean {
    return notEmptyString(this.adminName);
  }

  get hasCountry(): boolean {
    return notEmptyString(this.cc);
  }

  get hasRegion(): boolean {
    return notEmptyString(this.region) && sanitize(this.region) !== sanitize(this.adminName);
  }

  get showUKCountry(): boolean {
    return this.hasRegion && ["GB", "UK"].includes(this.cc);
  }

  get dmsString() {
    return [this.dmsLatString, this.dmsLngString].join(", ");
  }

  get dmsLatString() {
    return degAsDms(this.lat, "lat");
  }

  get dmsLngString() {
    return degAsDms(this.lng, "lng");
  }

  get dms(): CoordsDisplay {
    return {
      lat: decDegToDmsStrings(this.lat, "lat"),
      lng: decDegToDmsStrings(this.lng, "lng"),
    }
  }

  buildAxisClassNames(isLat = true): string {
    const val = isLat ? this.lat : this.lng;
    const cls = ['polarity', val < 0 ? 'negative' : 'positive'];
    if (isLat) {
      cls.push(val < 0 ? 'south' : 'north');
    } else {
      cls.push(val < 0 ? 'west' : 'east');
    }
    return cls.join(' ');
  }

  get latClassNames(): string {
    return this.buildAxisClassNames(true);
  }

  get lngClassNames(): string {
    return this.buildAxisClassNames(false);
  }

  toString() {
    const showUKC = this.showUKCountry;
    const regStr = this.hasRegion ? `, ${this.region}` : '';
    const extraAdm = showUKC ? '' : regStr;
    const admStr = this.hasAdmin ? `, ${this.adminName}${extraAdm}` : '';
    const ccStr = this.hasCountry ? showUKC? regStr : ` (${this.cc})` : '';
    
    return `${this.locality}${admStr}${ccStr}`;
  }

}

export class TimeZoneInfo {
  abbreviation = "";
  zoneName = "";
  utcOffset = 0;
  period: UnixTimeRange = { start: 0, end: 0, hasEnd: false };
  solarUtcOffset = 0;
  weekDay = 0; // 1 = Mon, 7 = Sun
  localTs = 0;

  constructor(inData: any = null) {
    if (inData instanceof Object) {
      let utcSet = false;
      Object.entries(inData).forEach(([key, val]) => {
        if (isNumeric(val)) {
          const flVal = smartCastFloat(val);
          switch (key) {
            case "utcOffset":
            case "gmtOffset":
              this.utcOffset = flVal;
              utcSet = true;
              break;
            case "solarUtcOffset":
              this.solarUtcOffset = flVal;
              break;
            case "weekDay":
              if (flVal >= 1 && flVal <= 7) {
                this.weekDay = Math.round(flVal);
              }
              break;
          }
        } else if (val instanceof Object) {
          const { start, end } = val as UnixTimeRange;
          if (typeof start === "number") {
            this.period.start = start;
          }
          if (typeof end === "number" && end > start) {
            this.period.end = end;
            this.period.hasEnd = true;
          }
        } else if (notEmptyString(val)) {
          switch (key) {
            case "abbreviation":
            case "abbr":
              this.abbreviation = val as string;
              break;
            case "zoneName":
            case "zone":
              this.zoneName = val as string;
              break;
          }
        }
      });
      if (utcSet && this.zoneName.length < 3) {
        const hourOffset = zeroPad(this.hours, 2);
        this.zoneName = ["Region", hourOffset].join("/");
        this.abbreviation = hourOffset;
      }
    }
    this.localTs = localOffsetSecs();
  }

  get hasStart(): boolean {
    return typeof this.period.start === "number";
  }

  get hasClockChange(): boolean {
    return this.hasStart || this.hasEnd;
  }


  get startDt(): string {
    return unixTimeToJulDate(this.period.start, this.utcOffset).dmyHms;
  }

  get endDt(): string {
    return unixTimeToJulDate(this.period.end, this.utcOffset).dmyHms;
  }

  get hasEnd(): boolean {
    return typeof this.period.end === "number" && this.period.hasEnd;
  }

  get hours(): number {
    return this.utcOffset / 3600;
  }

  get minutes(): number {
    return Math.abs((this.utcOffset / 60) % 60);
  }

  get differentTime(): boolean {
    return this.utcOffset !== this.localTs;
  }

  get difference(): string {
    const diff = this.utcOffset - this.localTs;
    const neg = diff < 0;
    const absDiff = Math.abs(diff);
    const mins = Math.floor(absDiff / 60) % 60;
    const hours = Math.floor(absDiff / 3600);
    const polarity = neg ? '-' : '+';
    const parts = [polarity + zeroPad2(hours)];
    if (mins > 0) {
      parts.push(zeroPad2(mins));
    }
    return parts.join(':');
  }

  get offsetString(): string {
    const polarity = this.utcOffset < 0 ? '-' : '+';
    const showMinutes = this.minutes > 0;
    const parts = [polarity + zeroPad2(Math.floor(Math.abs(this.hours)))];
    if (showMinutes) {
      parts.push(zeroPad2(this.minutes));
    }
    return parts.join(":")
  }

  get valid(): boolean {
    return notEmptyString(this.zoneName);
  }
}


export class RiseSet {

  offset = 0;
  
  data: RiseSetGroup = {
    ic: 0,
    mc: 0,
    rise: 0,
    set: 0,
    prevSet: 0,
    nextRise: 0,
    min: 0,
    max: 0,
  };

  constructor(data: RiseSetGroup | undefined = undefined, offset = 0) {
    if (data instanceof Object) {
      this.data = data;
    }
    this.offset = offset;
  }

  get valid() {
    return this.data.mc > 1000;
  }

  get min() {
    return this.data.min;
  }

  get max() {
    return this.data.max;
  }

  get rise(): JulDate {
    return new JulDate(this.data.rise, this.offset);
  }

  get hasRise(): boolean {
    return this.data.rise > 1000;
  }

  get hasSet(): boolean {
    return this.data.set > 1000;
  }

  get set(): JulDate {
    return new JulDate(this.data.set, this.offset);
  }

  get prevSet(): JulDate {
    return new JulDate(this.data.prevSet, this.offset);
  }

  get nextRise(): JulDate {
    return new JulDate(this.data.nextRise, this.offset);
  }

}


export class BodySet {

  ts = 0;

  offset = 0;
  
  data: Map<string, number> = new Map();

  constructor(data: AstroLngs | undefined = undefined, ts  = 0, offset = 0) {
    if (data instanceof Object) {
      Object.entries(data).forEach(([key, value]) => {
        this.data.set(key, value);
      })
    }
    this.ts = ts;
    this.offset = offset;
  }

  get valid() {
    return this.data.has('ma') && this.data.has('ve');
  }

  list(): KeyNameValue[] {
    return bodies.filter((row: KeyName) => ['as','mo','su'].includes(row.key) === false).map((row: KeyName) => {
      const { key, name } = row;
      const lng = this.data.has(key) ? this.data.get(key) as number : 0;
      return { 
        key,
        className: ['body', key].join('-'),
        name,
        value: lng,
        display: degAsDms(lng)
      }
    })
  }

  calcAge(): number {
    return Math.round(Date.now() / 1000) - this.ts;
  }

  get date(): JulDate {
    return unixTimeToJulDate(this.ts, this.offset);
  }

  get lastUpdated(): string {
    return this.date.dmyHms;
  }


}

export class AstroObject {
  lng = 0;
  positions: number[] = [];

  constructor(inData: any = null) {
    if (inData instanceof Object) {
      const { lng, positions } = inData;
      if (typeof lng === 'number') {
        this.lng = lng;
      }
      if (positions instanceof Array) {
        this.positions = positions.filter(n => typeof n ==='number');
      }
    }
  }

  currentDegree(time = 0): number {
    const currTs = Date.now() / 1000;
    if (this.positions.length > 1) {
      const age = currTs - time;
      const numPositions = this.positions.length;
      const startIndex = Math.ceil(numPositions / 2);
      if (age < 43200 && age > -43200) {
        const hrsOld = age / 3600;
        const progressInHr = hrsOld % 1.0;
        const refStartIndex = startIndex + Math.floor(hrsOld);
        const refEndIndex = refStartIndex + 1;
        if (refEndIndex < numPositions) {
          const startPos = this.positions[refStartIndex];
          const endPos = this.positions[refEndIndex];
          const diff = endPos - startPos;
          const addProg = diff * progressInHr;
          return startPos + addProg;
        }
      }
    }
    return this.lng;
  }
}

export class Sun extends AstroObject {
  rise = 0;
  set = 0;
  mc = 0;
  ic = 0;
  min = 0;
  max = 0;

  constructor(inData: any = null) {
    super(inData);
    if (inData instanceof Object) {
      Object.entries(inData).forEach(([key, val]) => {
        switch (key) {
          case 'min':
          case 'max':
          case 'mc':
          case 'ic':
          case 'rise':
          case 'set':
            if (typeof val === 'number') {
              this[key] = val;
            }
            break;
        }
      });
    }
  }

  get riseTime(): string {
    if (this.max >= 0) {
      return unixTimeToJulDate(this.rise).hms;
    } else {
      return `down all day`;
    }
  }

  get dayLength(): number {
    if (this.max >= 0 && this.set > this.rise) {
      return this.set - this.rise;
    } else {
      return 0;
    }
  }

  get nightLength(): number {
    if (this.min > 0) {
      return 0;
    } else {
      return 86400 - this.dayLength;
    }
  }

  get dayDuration(): string {
    return secondsToHMS(this.dayLength);
  }

  get nightDuration(): string {
    return secondsToHMS(this.nightLength);
  }

  get highestPoint(): string {
    const mcTime = unixTimeToJulDate(this.mc).hms;
    const degs = degAsDms(this.mc, 'raw');
    return `${degs}, ${mcTime}`
  }

  get setTime(): string {
    if (this.min < 0) {
      return unixTimeToJulDate(this.set).hms;
    } else {
      return `up all day`;
    }
  }

  get hasNight(): boolean {
    return this.min < 0;
  }

  get hasDaylight(): boolean {
    return this.max >= 0;
  }

  get lowestPoint(): string {
    const mcTime = unixTimeToJulDate(this.ic).hms;
    const degs = degAsDms(this.ic, 'raw');
    return `${degs}, ${mcTime}`;
  }

}

export interface PhaseInfo {
  text: string;
  waxing: boolean;
  className: string;
  timeString: string;
  key: string;
}

export class MoonPhase {
  ts = 0;
  num = 0

  constructor(inData: any = null) {
    if (inData instanceof Object) {
      const { ts, num } = inData;

      if (typeof ts === 'number') {
        this.ts = ts;
      }
      
      if (typeof num === 'number') {
        this.num = num;
      }
    }
  }

  get toLabel(): string {
    switch (this.num) {
      case 1:
        return 'New Moon';
      case 2:
        return '2nd quarter';
      case 3:
        return 'Full moon';
      case 4:
        return '4th quarter';
      default:
        return '-';
    }
  }

  toInfo(offset = 0): PhaseInfo {
    const dt = unixTimeToJulDate(this.ts, offset).dmyHms;
    const waxing = this.num <= 2;
    const cls = [['q', this.num].join('-'), waxing? 'waxing' : 'waning' ];
    const className = cls.join(" ");
    let key = ['mp', this.ts, this.num].join('-');
    return {
      text: this.toLabel,
      timeString: dt,
      waxing,
      className,
      key
    };
  }

}

export class Moon extends AstroObject {
  phase = 0;
  sunAngle = 0;
  phases: MoonPhase[] = [];
  ts = 0;

  constructor(inData: any = null, ts = 0) {
    super(inData);
    if (inData instanceof Object) {
      const { phase, sunAngle, phases } = inData;

      if (typeof phase === 'number') {
        this.phase = phase;
      }
      
      if (typeof sunAngle === 'number') {
        this.sunAngle = sunAngle;
      }

      if (phases instanceof Array) {
        this.phases = phases.map(row => new MoonPhase(row));
      }
    }
    this.ts = 0;
  }

  get isWaxing(): boolean {
    return this.phase <= 2;
  }

  get currentPhase(): string {
    return new MoonPhase({ts: this.ts, num: this.phase}).toLabel;
  }
}

export class AstroData {
  start = 0;
  time = 0;
  end = 0;
  ascendant = new AstroObject();
  sun = new Sun();
  moon = new Moon();
  offset = 0;

  constructor(inData: any = null, ts = 0, offset = 0) {
    if (inData instanceof Object) {
      const { start, end, time, sun, moon, ascendant } = inData;
      if (typeof start === 'number') {
        this.start = start;
      }
      if (typeof time === 'number') {
        this.time = time;
      }
      if (typeof end === 'number') {
        this.end = end;
      }
      this.sun = new Sun(sun);
      this.moon = new Moon(moon, this.time);
      this.ascendant = new AstroObject(ascendant);
    }
    this.offset = offset;
  }

  get moonWaxing() {
    return this.moon.isWaxing;
  }

  get valid() {
    return this.moon.phases.length > 0;
  }

  moonPhases(): PhaseInfo[] {
    return this.moon.phases.map(phase => phase.toInfo(this.offset))
  }


  currentAscendantLng(): number {
    return this.ascendant.currentDegree(this.time)
  }

  currentMoonLng(): number {
    return this.moon.currentDegree(this.time)
  }

  currentSunLng(): number {
    return this.sun.currentDegree(this.time)
  }

  currentMoonPos(): string {
    return degAsDms(this.currentMoonLng());
  }

  currentSunPos(): string {
    return degAsDms(this.currentSunLng());
  }

  currentAscPos(): string {
    return degAsDms(this.currentAscendantLng());
  }

}