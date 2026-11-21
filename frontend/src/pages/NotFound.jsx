import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="card mx-auto mt-10 max-w-lg p-8 text-center">
      <p className="text-5xl font-bold text-brand-600">404</p>
      <h1 className="mt-2 text-lg font-semibold">Página no encontrada</h1>
      <Link to="/" className="mt-4 inline-block text-sm text-brand-700 hover:underline">
        Volver al inicio
      </Link>
    </div>
  );
}
