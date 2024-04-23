import { astroCalcBase, geoTimeBase } from "./settings";
import {  validISODateString } from "./utils";
import { ParamSet } from "./interfaces";
import { clearLocal, fromLocal, toLocal } from "../lib/localstore";

const matchService = (service = "") => {
  switch (service) {
    case "gtz":
    case "geo":
      return geoTimeBase;
    default:
      return astroCalcBase;
  }
};

const buildUri = (service = "", method = "") => {
  return [matchService(service), method].join("/");
};

const buildQueryString = (params: ParamSet): string => {
  const parts = Object.entries(params)
    .filter((entry) => {
      return entry[1] !== null && entry[1] !== undefined;
    })
    .map(([key, value]) => {
      return `${key}=${value}`;
    });
  return parts.length > 0 ? "?" + parts.join("&") : "";
};

export const fetchContentRemote = async (
  method: string,
  params: ParamSet,
  service = "",
  asArray = false
): Promise<any> => {
  const qStr = buildQueryString(params);
  const remote = method.startsWith("https://") || method.startsWith("http://");
  const uriString = method + qStr;
  const uri = remote ? uriString : buildUri(service, uriString);
  let data: any = asArray ? [] : { valid :false }
  await fetch(uri).then((response) => response.json()).then(json => {
    if (json instanceof Object) {
      if (asArray  && json instanceof Array) {
        data = json;
      } else {
        data = { valid :true, ...json };
      }
    }
  }).catch((e) => {
    console.log(e);
  });
  return data;
};

export const fetchContentAstro = async (
  method: string,
  params: ParamSet
): Promise<any> => {
  return await fetchContentRemote(method, params, "asc");
};

export const fetchContentGeo = async (
  method: string,
  params: ParamSet,
  asArray = false
): Promise<any> => {
  return await fetchContentRemote(method, params, "geo", asArray);
};

export const fetchTz = async (
  dt: string,
  loc: string,
  addPlaceNames = false
): Promise<any> => {
  const method = addPlaceNames ? `gtz` : `timezone`;
  const params: any = {
    dt,
    loc,
  };
  if (method === 'gtz') {
    params.astro = '1';
  }
  let ck = "";
  const hasValidDt = validISODateString(dt);
  if (hasValidDt) {
    const dtParts = dt.split('T');
    if (dtParts.length === 2) {
      const dtHrs = dtParts[1].split(":").shift();
      const dtKey = [dtParts[0], dtHrs].join('T');
      ck = ['tzd',dtKey, loc].join('_');
    }
  }
  const stored = hasValidDt ? fromLocal(ck, 3600) : { valid: false, expired: true };
  if (stored.valid && !stored.expired) {
    if (stored.data instanceof Object) {
      return stored.data;
    }
  } else {
    clearLocal(ck);
    const data = await fetchContentGeo(method, params);
    if (data instanceof Object && data.time instanceof Object) {
      toLocal(ck, data);
    }
    return data;
  }
};

export const fetchSunMoon = async (
  dt: string,
  loc: string
): Promise<any> => {
  const params: any = {
    dt,
    loc,
  };
  let ck = "";
  const hasValidDt = validISODateString(dt);
  if (hasValidDt) {
    const dtParts = dt.split('T');
    if (dtParts.length === 2) {
      const dtHrs = dtParts[1].split(":").shift();
      const dtKey = [dtParts[0], dtHrs].join('T');
      ck = ['astro',dtKey, loc].join('_');
    }
  }
  const stored = hasValidDt ? fromLocal(ck, 900) : { valid: false, expired: true };
  if (stored.valid && !stored.expired) {
    if (stored.data instanceof Object) {
      return stored.data;
    }
  } else {
    clearLocal(ck);
    const data = await fetchContentGeo('astro', params);
    if (data instanceof Object && data.time instanceof Object) {
      toLocal(ck, data);
    }
    return data;
  }
};

export const fetchGeoTz = async (dt: string, loc: string): Promise<any> =>
  fetchTz(dt, loc, true);

export const searchLocation = async (place: string, cc = ""): Promise<any> => {
  const method = `lookup`;
  const params = {
    place,
    cc,
    fuzzy: 100,
    max: 30,
  };
  const ck = ['lookup', place, cc].join("_");
  const stored = fromLocal(ck, 12 * 3600);
  if (!stored.expired && stored.valid && stored.data instanceof Array && stored.data.length > 0) {
    return stored.data
  } else {
    const data = await fetchContentGeo(method, params, true);
    if (data.length > 0) {
      toLocal(ck, data);
    }
    return data;
  }
  
};

export const fetchAstroPositions = async (
  params: ParamSet
): Promise<any> => {
  const dt = params.dt? params.dt.replace(/:(\d)\d$/, "$1") : '';
  const ck = `astroset_${params.loc}_${dt}`;
  const stored = fromLocal(ck, 600);
  if (!stored.expired && stored.valid && stored.data instanceof Object && stored.data.longitudes instanceof Object) {
    return stored.data
  } else {
    clearLocal(ck);
    params.bodies = 'me,ve,ma,ju,sa,ur,ne,pl';
    const data = await fetchContentAstro("positions", params);
    if (data instanceof Object && data.longitudes instanceof Object) {
      toLocal(ck, data);
    }
    return data;
  }
};

