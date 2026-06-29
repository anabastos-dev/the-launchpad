export default function Avatar({ person, size = 26 }) {
  if (!person) return null
  return (
    <div title={person.name} style={{ width: size, height: size, borderRadius: '50%', background: person.color || '#888780', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: size * 0.38, flexShrink: 0 }}>
      {person.initials}
    </div>
  )
}
