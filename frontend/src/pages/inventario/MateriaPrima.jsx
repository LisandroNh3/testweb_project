import ArticulosPage from './ArticulosPage.jsx';

export default function MateriaPrima() {
  return (
    <ArticulosPage
      tipo="MATERIA_PRIMA"
      titulo="Materia prima"
      subtitulo="Insumos que se descuentan automáticamente según la receta de cada producto vendido"
      unidadSugerida="lb"
    />
  );
}
