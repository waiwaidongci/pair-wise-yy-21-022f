export const CrewDutyStatus = ["ON_DUTY", "REST"] as const;
export type CrewDutyStatus = (typeof CrewDutyStatus)[number];
