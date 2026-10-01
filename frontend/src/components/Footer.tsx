export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <p className="font-bold text-primary">Lamar ACM</p>
            <p className="text-sm text-gray-500">Association for Computing Machinery — Lamar University</p>
          </div>
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} Lamar ACM Chapter</p>
        </div>
      </div>
    </footer>
  )
}
