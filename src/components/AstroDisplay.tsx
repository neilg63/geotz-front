import React from 'react';
import { AstroData } from '../api/models';

export default function AstroDisplay({info}: {info: AstroData}) {
  const moonPhases = info.moonPhases();
  return (
    <section className="sun-moon-ascendant">
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
      <ul className="labelled-list moon-phase-display">
      {info.valid && <>
        {moonPhases.map(item => <li key={item.key} className={item.className}>
          <strong>{item.text}</strong>
          <em>{item.timeString}</em>
        </li>)}
      </>}
    </ul>

    <h3 className="body-mo">Ascendant</h3>
    <dl className="twin-grid">
        <dt>Longitude</dt>
        <dd>
          {info.currentAscPos()}
        </dd>
      </dl>
    </section>
  );
}