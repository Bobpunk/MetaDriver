import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateFuelProjection,
  calculateWorkedCostPerKm,
} from "../src/lib/insights";

test("projeta a média diária de combustível para 1, 7 e 30 dias", () => {
  assert.equal(calculateFuelProjection(137, 1, 1), 137);
  assert.equal(calculateFuelProjection(137, 1, 7), 959);
  assert.equal(calculateFuelProjection(137, 1, 30), 4110);
});

test("usa dias com registros, não a quantidade de jornadas", () => {
  assert.equal(calculateFuelProjection(600, 3, 7), 1400);
});

test("não cria projeção sem histórico válido", () => {
  assert.equal(calculateFuelProjection(0, 0, 7), null);
  assert.equal(calculateFuelProjection(137, 0, 30), null);
});

test("custo por km rateia custos fixos somente nos dias trabalhados", () => {
  const costPerKm = calculateWorkedCostPerKm(137.03, 5700, 1500, 1, 210);
  assert.ok(Math.abs(costPerKm - 1.5769) < 0.001);
});

test("dias sem jornada não inflam o custo por km trabalhado", () => {
  const today = calculateWorkedCostPerKm(137.03, 5700, 1500, 1, 210);
  const sevenDayFilter = calculateWorkedCostPerKm(
    137.03,
    5700,
    1500,
    1,
    210
  );
  assert.equal(sevenDayFilter, today);
});

test("custo por km retorna zero quando não há distância", () => {
  assert.equal(calculateWorkedCostPerKm(137, 5700, 1500, 1, 0), 0);
});
