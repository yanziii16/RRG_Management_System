import { useLoad } from './useLoad';

export default function CottageList() {
  const { data, loading, error, reload } = useLoad('/api/cottages');

  if (loading) return <p>Starting the server. This can take up to a minute.</p>;

  if (error) {
    return (
      <div role="alert">
        <p>{error}</p>
        <button onClick={reload}>Try again</button>
      </div>
    );
  }

  if (data.length === 0) {
    return <p>No cottages yet. Ask the admin to add one so you can take reservations.</p>;
  }

  return (
    <ul>
      {data.map((c) => (
        <li key={c.id}>{c.name}: ₱{c.rate} (up to {c.capacity} guests)</li>
      ))}
    </ul>
  );
}