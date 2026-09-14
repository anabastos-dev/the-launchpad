function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
}

export default function Avatar({ person, size = 26 }) {
  if (!person) return null
  const display = person.initials || initials(person.name)
  return (
    <div title={person.name} style={{ width: size, height: size, borderRadius: '50%', background: person.color || '#888780', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: size * 0.38, flexShrink: 0 }}>
      {display}
    </div>
  )
}
