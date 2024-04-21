import { useEffect, useState } from 'react';
import { MAX_UNIX, fetchCurrentDateComponents, fetchRelativeDateComponents, julToUnixTime, minJd, roundFloat5, unixTimeToJul, unixTimeToJul5, utcDateStringFromUnix } from '../api/julian-date';
import { validDateString } from '../api/utils';
import Stack from '@mui/material/Stack';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { MobileDateTimePicker  } from '@mui/x-date-pickers';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import dayjs from 'dayjs';
import 'dayjs/locale/en-gb';
import 'dayjs/locale/de';
import 'dayjs/locale/fr';
import UpdateIcon from '@mui/icons-material/Update';
import RestoreIcon from '@mui/icons-material/Restore';
import { inputToNumber } from '../api/converters';
import { GeoLoc } from '../api/models';

export default function Converter({onUpdate, geo}: {onUpdate: Function, geo: GeoLoc}) {
  const [currDt, setCurrDt] = useState("2000-01-01T00:00:00");
  const [localeKey, setLocaleKey] = useState('en-gb');
  const [msOffset, setMsOffset] = useState(0);
  const [unix, setUnix] = useState(0);
  const [jd, setJd] = useState(0);
  const [updating, setUpdating] = useState(false);

  const applyNewDateTime = (newVal: any = null) => {
    if (newVal) {
      const newUnix = Math.round(newVal.$d.getTime() / 1000);
      setUnix(newUnix);
      setJd(roundFloat5(unixTimeToJul(newUnix)))
    }
  }

  const updateDtFromUnix = (unix = 0) => {
    const updated = fetchRelativeDateComponents(unix);
    if (validDateString(updated.date)) {
      setCurrDt(updated.dt);
    }
  }

  const addForLeapYear = (ts = 0, sub = false) => {
    const dt = new Date(ts * 1000);
    const mo = dt.getUTCMonth();
    let yr = dt.getUTCFullYear();
    if (mo <= 1 && sub) {
      yr -= 1;
    } else if (mo >= 1 && !sub) {
      yr += 1;
    }
    return yr % 4 === 0 && yr % 400 !== 0;
  }


  const addUnix = (val = 0, unit = 'd') => {
    let unitVal = 86400;
    switch (unit) {
      case 'y':
        unitVal *= addForLeapYear(unix)? 366 : 365;
        break;
    }
    const newUnix = unix + unitVal * val;
    if (newUnix <= MAX_UNIX) {
      setUnix(newUnix);
      setJd(roundFloat5(unixTimeToJul(newUnix)))
      updateDtFromUnix(newUnix);
    }
  }

  const handleIntChange = (e: any) => {
    let inputEl = undefined;
    if (e instanceof Object) {
      inputEl = e.target;
    } else if (typeof e === 'string') {
      let refId = e === 'jd' ? 'input-jd' : 'input-unix';
      inputEl = document.getElementById(refId);
    }
    if (inputEl instanceof HTMLInputElement && !updating) {
      setUpdating(true);
      const {name, value } = inputEl;
      let jdV = 0;
      let tsV = 0;
      switch (name) {
        case 'jd':
          jdV = roundFloat5(inputToNumber(value));
          setJd(jdV);
          break;
        case 'unix':
          tsV = typeof value === "number" ? Math.round(value) : parseInt(value, 10);
          setUnix(tsV);
          break;
      }
      if (typeof unix === 'number' && isNaN(unix) === false && jd > minJd()) {
        switch (name) {
          case 'jd':
            setUnix(Math.round(julToUnixTime(jdV)));
            break;
          case 'unix':
            setJd(roundFloat5(unixTimeToJul(tsV)))
            break;
        }
        if (unix <= MAX_UNIX) {
          updateDtFromUnix(unix);
        }
      }
      setTimeout(() => {
        setUpdating(false);
      }, 250);
    }
  }

  const resetNow = () => {
    const nowTs = Math.round(Date.now() / 1000);
    setJd(roundFloat5(unixTimeToJul(nowTs)))
    setUnix(nowTs);
    updateDtFromUnix(nowTs);
    const dt = utcDateStringFromUnix(nowTs);
    const { lat, lng } = geo;
    const inData = {
      now: true,
      dt,
      lat,
      lng
    }
    onUpdate(inData);
}

  const updateAndRecalc = () => {
    if (onUpdate instanceof Function) {
      const dt = utcDateStringFromUnix(unix);
      const { lat, lng } = geo;
      const inData = {
        ts: unix,
        dt,
        lat,
        lng
      }
      onUpdate(inData);
    }
  }

  // run once
  useEffect(() => {
    const current = fetchCurrentDateComponents();
    setCurrDt(current.dt);
    setMsOffset(current.msOffset);
    
    const ts = Math.round(Date.now() / 1000);
    setUnix(ts);
    setJd(unixTimeToJul5(ts))
  },[]);
  return (
    <Stack spacing={3} sx={{ width: '24em' }}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={localeKey}>
        <DemoContainer components={['MobileDateTimePicker']}>
          <MobileDateTimePicker  label="Pick a date and time" value={dayjs(currDt)} onChange={(newValue) => applyNewDateTime(newValue)} />
        </DemoContainer>
      </LocalizationProvider>
      <div className="numbers">
        <div className='vertical row unixtime add-controls'>
        <Button size="small" variant="outlined" id="minus-year-bt" onClick={(e) => addUnix(-1, 'y')}><strong>-</strong><sup>year</sup></Button>
        <Button size="small" variant="outlined" color="secondary" id="minus-week-bt" onClick={(e) => addUnix(-7, 'd')}><strong>-</strong><sup>week</sup></Button>
        <Button size="small" variant="outlined" id="minus-day-bt" onClick={(e) => addUnix(-1, 'd')}><strong>-</strong><sup>day</sup></Button>
        <TextField
            id="unix-input"
            label="Unix time"
            name="unix"
            type="number"
            value={unix}
            onChange={(e: any) => handleIntChange(e)}
            InputLabelProps={{
              shrink: true,
            }}
          />
          <Button size="small" variant="outlined" id="plus-day-bt" onClick={(e) => addUnix(1, 'd')}><strong>+</strong><sup>day</sup></Button>
          <Button size="small" variant="outlined" color="secondary" id="plus-week-bt" onClick={(e) => addUnix(7, 'd')}><strong>+</strong><sup>week</sup></Button>
          <Button size="small" variant="outlined" id="plus-year-bt" onClick={(e) => addUnix(1, 'y')}><strong>+</strong><sup>year</sup></Button>
        </div>
        <div className="horizontal row julian-days update-controls">
        <Button size="small" variant="contained" color="success" id="reset-bt" onClick={() => resetNow()} endIcon={<RestoreIcon />}><sup>Reset</sup></Button>  
        <TextField
            id="jd-input"
            label="Julian days"
            name="jd"
            type="text"
            value={jd.toString(10)}
            onChange={(e: any) => handleIntChange(e)}
            InputLabelProps={{
              shrink: true,
            }}
          />
          <Button size="small" variant="contained" color="success" id="reset-bt" onClick={() => updateAndRecalc()} endIcon={<UpdateIcon />}><sup>Update</sup></Button>  
        </div>
      </div>
    </Stack>
  );
}