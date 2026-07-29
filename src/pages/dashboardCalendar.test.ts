import { describe, expect, it } from "vitest";
import {
  calendarDateInput,
  shiftDashboardCalendarMonth,
} from "./dashboardCalendar";

describe("calendario do dashboard", () => {
  it("avanca e retorna meses, inclusive entre anos", () => {
    const julho = new Date(2026, 6, 1);

    expect(shiftDashboardCalendarMonth(julho, 1)).toEqual(new Date(2026, 7, 1));
    expect(shiftDashboardCalendarMonth(julho, -1)).toEqual(new Date(2026, 5, 1));
    expect(shiftDashboardCalendarMonth(new Date(2026, 11, 1), 1)).toEqual(
      new Date(2027, 0, 1),
    );
  });

  it("transforma o dia selecionado na data enviada para a API", () => {
    expect(calendarDateInput(2026, 6, 29)).toBe("2026-07-29");
  });
});
