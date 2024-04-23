import React, { useCallback, useEffect, useState } from 'react';
import Tooltip from '@mui/material/Tooltip';
import HelpOutline from '@mui/icons-material/HelpOutline';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import './App.css';
import { fetchAstroPositions, fetchTz } from './api/fetch';
import PlaceFinder from './components/PlaceFinder';
import { ParamSet, PlaceRow } from './api/interfaces';
import { fetchGeo } from './api/geoloc-utils';
import { AstroData, BodySet, GeoLoc, PlaceInfo, TimeZoneInfo } from './api/models';
import LocationDisplay from './components/LocationDisplay';
import TimeInfo from './components/TimeInfo';
import { notEmptyString, zeroPad2 } from './api/utils';
import { currentJulianDate, initDateParts, } from './api/julian-date';
import { currentUtcDateString } from './api/julian-date';
import BodiesDisplay from './components/BodiesDisplay';
import AstroDisplay from './components/AstroDisplay';
import Converter from './components/Converter';
import { toLocal } from './lib/localstore';

function App() {
  const [wrapperClassNames, setWrapperClassNames] = useState('App');
  const [geo, setGeo] = useState( new GeoLoc());
  const initDateDisplay = initDateParts();
  const [currentDtDisplay, setCurrentDtDisplay] = useState(initDateDisplay)
  const [currentGeo, setCurrentGeo] = useState( new GeoLoc());
  const [astro, setAstro] = useState(new AstroData());
  const [isCurrent, setIsCurrent] = useState(true)
  const [bodySet, setBodySet] = useState(new BodySet());
  const [ts, setTs] = useState(Math.round(Date.now() / 1000));
  const [hasFetchedGeoTime, setHasFetchedGeoTime] = useState(false);
  const [infoLoaded, setInfoLoaded] = useState(false);
  const [extraLoaded, setExtraLoaded] = useState(false);
  const [timeInfo, setTimeInfo] = useState( new TimeZoneInfo());
  const [placeInfo, setPlaceInfo] = useState( new PlaceInfo());
  const [currentPlaceInfo, setCurrentPlaceInfo] = useState( new PlaceInfo());


  const fetchAstroData = useCallback((geo: GeoLoc, dt = '', utcOffset = 0) => {
    fetchAstroPositions({loc: geo.toString(), dt }).then((result: any) => {
      if (result instanceof Object) {
        const { longitudes, date } = result;
        if (date instanceof Object) {
          const ts = date.unix? date.unix as number : 0;
          if (longitudes instanceof Object) {
            setExtraLoaded(false);
            setBodySet(new BodySet(longitudes, ts, utcOffset));
            setTimeout(() => {
              setExtraLoaded(true);
            }, 250);
          }
        }
      }
    })
  }, []); 

  const toggleHelp = () => {
    const cls = ['App'];
    if (wrapperClassNames.includes('show-help') === false) {
      cls.push('show-help')
    }
    setWrapperClassNames(cls.join(' '));
  }

  const hideHelp = () => {
    setWrapperClassNames('App');
  }

  const loadLocation = useCallback((inData: ParamSet, current = false) => {
    const valid = inData instanceof Object;
    if (valid) {
      const keys = Object.keys(inData);
      const geo = new GeoLoc(inData);
      if (keys.includes('lat') && keys.includes('lng')) {
        setGeo(geo);
      }
      if (keys.includes('ts')) {
        if (typeof inData.ts === 'number') {
          setTs(inData.ts)
          setIsCurrent(false);
        }
      } else if (keys.includes('now')) {
        setTs(Math.round(Date.now() / 1000));
        setIsCurrent(true);
      }
      const fullMode = keys.includes('text') === false;
      if (!fullMode) {
        setPlaceInfo(new PlaceInfo(inData));
        setInfoLoaded(true);
      }
      const dt = notEmptyString(inData.dt) ? inData.dt : currentUtcDateString();
      setInfoLoaded(false);
      fetchTz(dt, geo.toString(), true).then((data: any) => { 
        let ti: TimeZoneInfo | undefined = undefined;
        if (data instanceof Object) {
          const keys = Object.keys(data);
          const parseAsFull = keys.includes('time')
          if (parseAsFull) {
            const { time, place, astro } = data;
            if (time) {
              ti = new TimeZoneInfo(time);
              if (astro instanceof Object) {
                setAstro(new AstroData(astro, ts, ti.utcOffset));
              }
            }
            if (place instanceof Object && fullMode) {
              setPlaceInfo(new PlaceInfo(place));
              if (current) {
                setCurrentPlaceInfo(new PlaceInfo(place));
                toLocal('current_place', place);
              }
              setInfoLoaded(true);
            }
          } else {
            ti = new TimeZoneInfo(data);
            setInfoLoaded(true);
          }
          if (ti instanceof TimeZoneInfo) {
            setTimeInfo(ti)
            setTimeout(() => {
              if (ti) {
                fetchAstroData(geo, dt, ti?.utcOffset);
              }
            }, 200);
            setInfoLoaded(true);
            if (current) {
              setCurrentGeo(geo);
              toLocal('current_geo', geo);
            }
          }

        }
        return true;
      });
    }
  }, [fetchAstroData, ts]);

  const updateCurrentDt = () => {
    const jDate = currentJulianDate();
    setCurrentDtDisplay({
      date: jDate.dmyDate,
      time: jDate.hm,
      seconds: zeroPad2(jDate.seconds)
    });
  }
  setInterval(() => {
    updateCurrentDt();
  }, 1000)

  useEffect(() => {
    if (!hasFetchedGeoTime) {
      setHasFetchedGeoTime(true)
      fetchGeo((result: any) => {
        const geo = new GeoLoc(result);
        setGeo(geo);
        if (result instanceof Object) {
          result.dt = currentUtcDateString();
          loadLocation(result, true);
        }
      });

      window.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.code) {
          const kc = e.code.toLowerCase();
          if (kc === 'escape') {
            hideHelp();
          }
        }
      });
    }
  }, [hasFetchedGeoTime,loadLocation]);
  return (
    <div className={wrapperClassNames}>
      <header className="App-header">
        <h1 title="Developed by Multifaceted Web Services">
          <a href="https://www.multifaceted.info" target='_blank' rel="noreferrer">
          <span className="green">Geo</span>
          <span className="mid">Time</span>
          <span className="orange">Zone</span>
          </a>
        </h1>
        <Tooltip title={currentGeo.toDisplay()}>
        <h3>
            <span className='date'>{currentDtDisplay.date}</span><time className='hours-minutes'>{currentDtDisplay.time}</time><em className='seconds'>{currentDtDisplay.seconds}</em>
        </h3>
        </Tooltip>
        <HelpOutline onClick={() => toggleHelp()} className="toggle-help"/>
      </header>
      <main className="main-section">
          <section className="controls-wrapper">
            <LocationDisplay info={placeInfo} />
            <PlaceFinder onChange={(row: PlaceRow) => loadLocation(row)} current={currentPlaceInfo}/>
            <Converter onUpdate={(row: any = null) => loadLocation(row)} geo={geo} />
          </section>
          {infoLoaded && <section className='inner'>
            <TimeInfo info={timeInfo} ts={ts} isCurrent={isCurrent} />
            <AstroDisplay info={astro} />
            {extraLoaded && <>
              <BodiesDisplay info={bodySet} />
            </>}
        </section>}
      </main>
      <footer className='footer'>
        <p className='copyright'><strong>©</strong><span>2024</span> <a href="https://www.multifaceted.info" target='_blank' rel="noreferrer">Multifaceted Web Services</a></p>
      </footer>
      <aside className="help">
          <CloseOutlined onClick={() => hideHelp()} className="close" />
          <div className='inner scrollable'>
            <div className='content'>
              <h4>Enable geolocation in your browser</h4>
              <p>The app needs access to your current location to fetch the correct time zone information, sunrise and sunset times, moon phases, ascendant and projected planetary positions</p>
              <h4>Search other towns and cities</h4>
              <p>The auto-complete lookup uses a custom Web service to match strategic towns and cities (over 40,000) around the world with the correct time-zone location.</p>
              <h4>Select a different time and date</h4>
              <p>The date and time field opens a mobile-friendly date and time picker. Press the <em>update</em> button to fetch matchning data.</p>
              <h4>Convert between Unix and Julian days</h4>
              <p>Many Web applications use Unix time, the number of seconds since the start of 1st January 1970, UTC. This will be the same all time zones. Negatives values represent dates before 1970. With signed 64-bit integers, we will have no problems representing dates after 2038.</p>
              <p>Many astronomical applications use Julian days, i.e. the numbers since since 12 noon, 24th November 4713 BCE.</p>
            </div>
          </div>
      </aside>
    </div>
  );
}

export default App;
