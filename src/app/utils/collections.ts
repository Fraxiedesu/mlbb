export function clamp(value: number, minimum = 0, maximum = 100) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function average(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function unique<T>(values: T[]) {
  return [...new Set(values)];
}

export function countMatches<T extends string>(source: T[], targets: T[]) {
  const targetSet = new Set(targets);
  return source.filter((item) => targetSet.has(item)).length;
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function sortByScore<T extends { total?: number; overall?: number; score?: number }>(items: T[]) {
  return [...items].sort((left, right) => {
    const leftValue = left.overall ?? left.total ?? left.score ?? 0;
    const rightValue = right.overall ?? right.total ?? right.score ?? 0;
    return rightValue - leftValue;
  });
}
