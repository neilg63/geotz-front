import { PlaceInfo } from '../api/models';
import LocationOnIcon from '@mui/icons-material/LocationOn';

export default function LocationDisplay({info}: {info: PlaceInfo}) {
  
  return (
    <div className="location-display">
      {info.hasContent && <>
        <h3>
          {info.toString()}
        </h3>
        <h3 className="coords">
          <LocationOnIcon />
          <span className="latitude">
            <span className="degrees large">{info.dms.lat.deg}</span>
            <span className="minutes medium">{info.dms.lat.min}</span>
            <span className="seconds small">{info.dms.lat.sec}</span>
            <strong className={info.latClassNames}>{info.dms.lat.polarity}</strong>
          </span>
          <span className="longitude">
            <span className="degrees large">{info.dms.lng.deg}</span>
            <span className="minutes medium">{info.dms.lng.min}</span>
            <span className="seconds small">{info.dms.lng.sec}</span>
            <strong className={info.lngClassNames}>{info.dms.lng.polarity}</strong>
          </span>
        </h3>
      </>}
    </div>
  );
}