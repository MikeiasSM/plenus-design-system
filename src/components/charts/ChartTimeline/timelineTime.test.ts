import { autoDomain, timeTicks } from './timelineTime';

const day = (date: number, hours = 0, month = 9) => new Date(2026, month, date, hours).getTime();

describe('autoDomain', () => {
  it('arredonda as horas do dia para a hora cheia, sem passar de 0h a 24h', () => {
    expect(autoDomain([6 + 50 / 60, 17.2], 'dayHours')).toEqual([6, 18]);
    expect(autoDomain([22, 30], 'dayHours')).toEqual([22, 24]);
    expect(autoDomain([], 'dayHours')).toEqual([0, 24]);
  });

  it('arredonda as datas para o dia, com pelo menos um dia de faixa', () => {
    expect(autoDomain([day(12, 7), day(14, 19)], 'calendar')).toEqual([day(12), day(15)]);
    expect(autoDomain([day(12, 7), day(14)], 'calendar')).toEqual([day(12), day(14)]);
    expect(autoDomain([day(12, 7), day(12, 9)], 'calendar')).toEqual([day(12), day(13)]);
  });

  it('ignora o instante invalido', () => {
    expect(autoDomain([Number.NaN, 8, 12], 'dayHours')).toEqual([8, 12]);
  });
});

describe('timeTicks', () => {
  it('escolhe o passo de horas que deixa espaco entre as marcas', () => {
    expect(timeTicks([0, 24], 'dayHours', 600).map((tick) => tick.label)).toEqual(
      ['0h', '3h', '6h', '9h', '12h', '15h', '18h', '21h', '24h'],
    );
    expect(timeTicks([0, 24], 'dayHours', 100).map((tick) => tick.label)).toEqual(['0h', '12h', '24h']);
  });

  it('marca cada dia enquanto cabe, com o dia da semana quando sobra espaco', () => {
    expect(timeTicks([day(12), day(15)], 'calendar', 300).map((tick) => tick.label)).toEqual(
      ['Seg 12/10', 'Ter 13/10', 'Qua 14/10', 'Qui 15/10'],
    );
    expect(timeTicks([day(12), day(15)], 'calendar', 150).map((tick) => tick.label)).toEqual(
      ['12/10', '13/10', '14/10', '15/10'],
    );
  });

  it('passa para as segundas-feiras e depois para o primeiro de cada mes', () => {
    expect(timeTicks([day(1), day(31)], 'calendar', 300).map((tick) => tick.label)).toEqual(
      ['05/10', '12/10', '19/10', '26/10'],
    );
    expect(timeTicks([day(1, 0, 0), day(1, 0, 6)], 'calendar', 300).map((tick) => tick.label)).toEqual(
      ['01/01', '01/02', '01/03', '01/04', '01/05', '01/06', '01/07'],
    );
  });
});
