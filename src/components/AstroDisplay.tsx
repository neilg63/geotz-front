import React from 'react';
import { AstroData } from '../api/models';

export default function AstroDisplay({info}: {info: AstroData}) {
  const moonPhases = info.moonPhases();
  return (
    <>
      <div className="subsection sun-wrapper">
      <h3 className="body-su">Sun</h3>
      <dl className="twin-grid">
        <dt>Longitude</dt>
        <dd>
          {info.currentSunPos()}
        </dd>
        <dt>Rises at</dt>
        <dd>
          {info.sun.riseTime}
        </dd>
        <dt>Highest</dt>
        <dd>
          {info.sun.highestPoint}
        </dd>
        {info.sun.hasDaylight && <>
          <dt>Sets at</dt>
          <dd>
            {info.sun.setTime}
          </dd>
        </>}
        <dt>Lowest</dt>
        <dd>
          {info.sun.lowestPoint}
        </dd>
      </dl>
      </div>
    <div className='subsection ascendant-wrapper'>
      <h3 className="body-mo">Ascendant</h3>
      <dl className="twin-grid">
          <dt>Longitude</dt>
          <dd>
            {info.currentAscPos()}
          </dd>
        </dl>
    </div>
      <div className='subsection moon-wrapper'>
      <h3 className="body-mo">Moon</h3>
      <dl className="twin-grid">
        <dt>Longitude</dt>
        <dd>
          {info.currentMoonPos()}
        </dd>
        <dt>Current phase</dt>
        <dd>
          {info.moon.currentPhase}
        </dd>
      </dl>
      <ul className="subsection labelled-list moon-phase-display">
      {info.valid && <>
        {moonPhases.map(item => <li key={item.key} className={item.className}>
          <strong>{item.text}</strong>
          <em>{item.timeString}</em>
        </li>)}
      </>}
    </ul>
    </div>
    </>
  );
}