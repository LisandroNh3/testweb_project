// Los montos se calculan con Number y se redondean a centavos en cada paso.
export const round2 = (valor) => Math.round((Number(valor) + Number.EPSILON) * 100) / 100;

export const round3 = (valor) => Math.round((Number(valor) + Number.EPSILON) * 1000) / 1000;

export const toNumber = (valor) => Number(valor ?? 0);

export const sumBy = (items, selector) =>
  round2(items.reduce((acumulado, item) => acumulado + Number(selector(item) ?? 0), 0));
