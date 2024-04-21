import { useCallback, useEffect, useState } from 'react';
import { TimeZoneInfo } from '../api/models';
import { currentJulDateOffset, unixTimeToJulDate } from '../api/julian-date';
import Tooltip from '@mui/material/Tooltip';

export default function LocationDisplay({info, ts, isCurrent}: {info: TimeZoneInfo, ts: number, isCurrent: boolean}) {
  const [jdt, setJdt] = useState(currentJulDateOffset(info.utcOffset));
  const [prevTs, setPrevTs] = useState(-10000000000);
  const [wrapperClasses, setWrapperClasses] = useState("time-info-display twin-grid");
  const updateTs = useCallback(() => {
    if (ts !== prevTs) {
      const newJdt = isCurrent ? currentJulDateOffset(info.utcOffset) : unixTimeToJulDate(ts, info.utcOffset);
      const cls = ["time-info-display", "twin-grid"];
      if (isCurrent) {
        cls.push("current-time");
      }
      setWrapperClasses(cls.join(" "))
      setJdt(newJdt);
      setPrevTs(ts);
    }
  }, [ts, isCurrent, info.utcOffset, prevTs])
  // run once
  setInterval(() => {
    updateTs();
  }, 1000);
  useEffect(() => {
    updateTs();
  }, [isCurrent,updateTs])
  return (
    <>
      <dl className={wrapperClasses}>
      {info.valid && <>
        <dt>UTC offset</dt><dd>
          <span>{info.offsetString}</span>
          <span className="abbr">({info.abbreviation})</span>
        </dd>
        {info.differentTime && <>
          <dt>Difference</dt><dd>{info.difference}</dd>
        </>}
        <dt>Zone</dt><dd>
          {info.zoneName}
        </dd>
        <dt><Tooltip title="Seconds since the start of 1 January 1970 UTC"><em>Unix time</em></Tooltip></dt><dd>{jdt.unixTimeDisplay}</dd>
        <dt><Tooltip title="12 noon on 24th November 4713 BCE"><em>Julian day</em></Tooltip></dt>
        <dd className="decimal-row">
          <span className="whole">{jdt.jdRound}</span>
          <span className="dot">.</span>
          <span className="decimals small">{jdt.jdDecimals}</span>
        </dd>
        <dt>Local date/time</dt>
        <dd>
          <span className="date">{jdt.dmyDate}</span>
          <span className="time">{jdt.hms}</span>
        </dd>
        
      </>}
    </dl>
    {info.hasClockChange && <>
      <h4>Clock changes</h4>
      <dl className={wrapperClasses}>
        {info.hasStart && <>
          <dt>Last</dt><dd>{info.startDt}</dd>
        </>}
        {info.hasEnd && <>
          <dt>Next</dt><dd>{info.endDt}</dd>
        </>}
      </dl>
    </>}
    </>
  );
}