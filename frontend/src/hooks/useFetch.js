import { useCallback, useEffect, useState } from 'react';

/**
 * Ejecuta una función async al montar el componente (y cuando cambian `deps`)
 * y expone { data, loading, error, reload }.
 */
export function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vigente = true;
    const cargar = async () => {
      setLoading(true);
      setError(null);
      try {
        const resultado = await fetcher();
        if (vigente) setData(resultado);
      } catch (err) {
        if (vigente) setError(err.message);
      } finally {
        if (vigente) setLoading(false);
      }
    };
    cargar();
    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return { data, loading, error, reload, setData };
}
