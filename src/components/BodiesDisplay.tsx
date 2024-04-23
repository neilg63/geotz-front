import { BodySet} from '../api/models';

export default function BodiesDisplay({info}: {info: BodySet}) {
  const items = info.list();
  return (
    <div className='subsection planets'>
      <h3>Planets</h3>
      <ul className="labelled-list bodies-display">
        {info.valid && <>
          {items.map(item => <li key={item.key} className={item.className}>
            <strong>{item.name}</strong>
            <em>{item.display}</em>
          </li>)}
        </>}
      </ul>
      <p className='updated'><em>Updated</em><time>{info.lastUpdated}</time></p>
    </div>
  );
}