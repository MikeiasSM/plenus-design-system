import type { Familia } from '../catalogo';

export function VisaoGeral({ familias }: { familias: readonly Familia[] }) {
  return (
    <article className="page-content overview">
      <p className="crumb">Plenustech Design System</p>
      <div className="page-title">
        <h1>Componentes</h1>
      </div>
      <p className="page-lead">
        Cada componente tem a própria página: playground ao vivo, exemplos de uso, variantes, modos e estados,
        acessibilidade e API. Agrupados pelas famílias do catálogo.
      </p>
      {familias.map((familia) => (
        <section aria-labelledby={`familia-${familia.nome}`} className="overview-family" key={familia.nome}>
          <h2 id={`familia-${familia.nome}`}>
            {familia.nome} <span>{familia.componentes.length}</span>
          </h2>
          <div className="overview-grid">
            {familia.componentes.map((componente) => (
              <a className="overview-card" href={`#/${componente.nome.toLowerCase()}`} key={componente.nome}>
                <strong>{componente.nome}</strong>
                <small>{componente.papel}</small>
              </a>
            ))}
          </div>
        </section>
      ))}
    </article>
  );
}
