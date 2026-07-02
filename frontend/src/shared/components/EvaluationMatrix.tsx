interface EvaluationRow {
  id: string;
  category: string;
  name: string;
  weight: string | number;
  maxScore: string | number;
}

interface EvaluationMatrixProps {
  rows: EvaluationRow[];
}

export function EvaluationMatrix({ rows }: EvaluationMatrixProps) {
  return (
    <div className="table-shell matrix">
      <table>
        <thead>
          <tr>
            <th>Categoria</th>
            <th>Criterio</th>
            <th>Peso</th>
            <th>Puntaje maximo</th>
            <th>Puntaje</th>
            <th>Observacion</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="empty-cell">
                Sin criterios cargados
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id}>
                <td>{row.category}</td>
                <td>{row.name}</td>
                <td>{row.weight}</td>
                <td>{row.maxScore}</td>
                <td>
                  <input className="cell-input" type="number" min="0" />
                </td>
                <td>
                  <input className="cell-input" type="text" />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
