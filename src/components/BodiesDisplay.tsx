import { BodySet} from '../api/models';

export default function BodiesDisplay({info}: {info: BodySet}) {
  const items = info.list();
  return (
    <ul className="labelled-list bodies-display">
      {info.valid && <>
        {items.map(item => <li key={item.key} className={item.className}>
          <strong>{item.name}</strong>
          <em>{item.display}</em>
        </li>)}
      </>}
      <li>Updated: {info.lastUpdated}</li>
    </ul>
  );
}