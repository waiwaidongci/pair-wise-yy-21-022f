import { DispatchStateText } from "../constants/dispatch";

export const formatDate = (value: string) => (value ? new Date(value).toLocaleString("zh-CN") : "—");
export const formatStatus = (value: string) => value.replace(/_/g, " ");
export const formatNumber = (value: number) => new Intl.NumberFormat("zh-CN").format(value);
export const formatRisk = (value: string) => ({ LOW: "低", MEDIUM: "中", HIGH: "高", CRITICAL: "严重", EXTREME: "极高" }[value] ?? value);
export const formatDispatchState = (value: string) => DispatchStateText[value] ?? value;
export const formatCapacity = (inHand: number, capacity: number) => `${inHand}/${capacity}`;
export const formatSkills = (skills: string[]) => (skills.length ? skills.join("、") : "无");
