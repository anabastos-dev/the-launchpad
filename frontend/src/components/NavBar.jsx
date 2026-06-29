import { Link } from 'react-router-dom'

export default function NavBar({ onLogout, alertCount = 0 }) {
  return (
    <header className="border-b border-gray-800 bg-gray-950 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
      <Link to="/" className="flex items-center gap-3">
        <span className="font-bold text-white tracking-tight">Minimal Club</span>
        <span className="text-gray-600 text-sm hidden sm:block">Campanhas</span>
      </Link>
      <div className="flex items-center gap-4">
        {alertCount > 0 && (
          <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            {alertCount} crítico{alertCount > 1 ? 's' : ''}
          </span>
        )}
        <button onClick={onLogout} className="text-sm text-gray-500 hover:text-white transition">
          Sair
        </button>
      </div>
    </header>
  )
}
