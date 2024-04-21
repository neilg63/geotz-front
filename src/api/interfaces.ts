
export interface ParamSet {
  [key: string]: any;
}

export interface PlaceRow {
  lat: number;
  lng: number;
  text: string;
  zoneName: string;
}

export interface AstroLngs {
  as: number;
  su: number;
  mo: number;
  ma: number;
  me: number;
  ju: number;
  ve: number;
  sa: number;
  ur: number;
  ne: number;
  pl: number;
}

export interface RiseSetGroup {
  ic: number;
  max: number;
  mc: number;
  min: number;
  nextRise: number;
  prevSet: number;
  rise: number;
  set: number;
}

export interface KeyValueName {
  key: string;
  value: string;
  name: string;
}

export interface DateDisplay {
  date: string;
  time: string;
  seconds?: string;
}