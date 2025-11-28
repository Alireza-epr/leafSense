import { EPastTime, IPastTime } from "@/types/generalTypes";

export const getLocaleISOString = (a_Date: Date, a_Past?: IPastTime) => {
  let pastMS = 0;
  if (a_Past) {
    switch (a_Past.unit) {
      case EPastTime.days:
        pastMS = a_Past.value * 86400000;
        break;
      case EPastTime.weeks:
        pastMS = a_Past.value * 604800000;
        break;
      case EPastTime.months:
        pastMS = a_Past.value * 2592000000;
        break;
      case EPastTime.years:
        pastMS = a_Past.value * 31536000000;
        break;
    }
  }

  const date = new Date(a_Date.getTime() - pastMS);

  const localeTimeISO = date.toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const localeDateISO = date.toLocaleDateString("sv-SE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return `${localeDateISO}T${localeTimeISO}`;
};
