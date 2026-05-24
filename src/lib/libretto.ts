export type ExamLike = {
  voto: number;
  lode: boolean;
  cfu: number;
};

export const round2 = (n: number) => Math.round(n * 100) / 100;

export const weightedAverage = (exams: ExamLike[]): number => {
  const totalCfu = exams.reduce((s, e) => s + e.cfu, 0);
  if (totalCfu === 0) return 0;
  const weighted = exams.reduce((s, e) => s + e.voto * e.cfu, 0);
  return round2(weighted / totalCfu);
};

export const totalCfu = (exams: ExamLike[]): number =>
  exams.reduce((s, e) => s + e.cfu, 0);

export const lodeCount = (exams: ExamLike[]): number =>
  exams.filter((e) => e.lode).length;

export const graduationBase = (exams: ExamLike[]): number => {
  const media = weightedAverage(exams);
  return round2((media * 110) / 30);
};

export const formatVoto = (voto: number, lode: boolean): string =>
  lode && voto === 30 ? "30L" : String(voto);
