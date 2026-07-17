import { useMemo, useState } from "react";
import type { Checkin } from "./api";
import dayjs from "dayjs";

export const isInternal = (locationId: string) => {
  return locationId === "uomori";
};

export const getDateKey = (year: number, month: number, day: number) => {
  const monthStr = month.toString().padStart(2, "0");
  const dayStr = day.toString().padStart(2, "0");
  return `${year}/${monthStr}/${dayStr}`;
};

export const getDateHoursKey = (
  year: number,
  month: number,
  day: number,
  hours: number
) => {
  const monthStr = month.toString().padStart(2, "0");
  const dayStr = day.toString().padStart(2, "0");
  const hoursStr = hours.toString().padStart(2, "0");
  return `${year}/${monthStr}/${dayStr} ${hoursStr}`;
};

const useCheckin = () => {
  const [checkins, setCheckins] = useState<Checkin[]>([]);

  const lastCheckin = useMemo(() => {
    if (checkins.length === 0) {
      return null;
    }

    let last = checkins[0];
    for (const checkin of checkins.slice(1)) {
      const currentDate = new Date(checkin.updatedAt);
      const latestDate = new Date(last.updatedAt);
      if (!latestDate || currentDate > latestDate) {
        last = checkin;
      }
    }

    const lastDate = dayjs.utc(last.updatedAt).tz("Asia/Tokyo");
    const year = lastDate.year();
    const month = (lastDate.month() + 1).toString().padStart(2, "0");
    const day = lastDate.date().toString().padStart(2, "0");
    const hours = lastDate.hour().toString().padStart(2, "0");
    const minutes = lastDate.minute().toString().padStart(2, "0");

    const now = dayjs().tz("Asia/Tokyo");
    const active =
      lastDate.year() === now.year() &&
      lastDate.month() === now.month() &&
      lastDate.date() === now.date() &&
      lastDate.hour() === now.hour();

    return {
      location: last.locationId,
      date: `${year}/${month}/${day} ${hours}:${minutes}`,
      active,
    };
  }, [checkins]);

  const [thisMonthTime, thisMonthDays, thisYearTime, thisYearDays] =
    useMemo(() => {
      const year = new Date().getFullYear();
      const month = new Date().getMonth() + 1;

      let monthTime = 0;
      let yearTime = 0;

      let yearDays = new Set<string>();
      let monthDays = new Set<string>();

      for (const checkin of checkins) {
        if (!isInternal(checkin.locationId) || checkin.count === 0) {
          continue;
        }
        const key = getDateKey(checkin.year, checkin.month, checkin.day);

        // 年のチェックイン
        if (checkin.year === year) {
          yearTime += 1;
          yearDays.add(key);

          // 月のチェックイン
          if (checkin.month === month) {
            monthTime += 1;
            monthDays.add(key);
          }
        }
      }
      return [monthTime, monthDays.size, yearTime, yearDays.size];
    }, [checkins]);

  /**
   * 時間ごとのチェックイン数
   */
  const checkinsPerHour = useMemo(() => {
    const dict: Record<string, { internalCount: number; othersCount: number }> =
      {};

    for (const checkin of checkins) {
      const dayeHoursKey = getDateHoursKey(
        checkin.year,
        checkin.month,
        checkin.day,
        checkin.hours
      );
      if (!dict[dayeHoursKey]) {
        dict[dayeHoursKey] = { internalCount: 0, othersCount: 0 };
      }
      if (isInternal(checkin.locationId)) {
        dict[dayeHoursKey].internalCount += checkin.count;
      } else {
        dict[dayeHoursKey].othersCount += checkin.count;
      }
    }
    return dict;
  }, [checkins]);

  /**
   * 日ごとにチェックインした時間数
   */
  const checkinsPerDay = useMemo(() => {
    const dict: Record<string, { internalHours: number; othersHours: number }> =
      {};

    for (const checkin of checkins) {
      const dateKey = getDateKey(checkin.year, checkin.month, checkin.day);
      const currentHours = dict[dateKey] ?? {
        internalHours: 0,
        othersHours: 0,
      };
      if (checkin.count) {
        if (isInternal(checkin.locationId)) {
          currentHours.internalHours += 1;
        } else {
          currentHours.othersHours += 1;
        }
      }
      dict[dateKey] = currentHours;
    }
    return dict;
  }, [checkins]);

  return {
    checkins,
    lastCheckin,
    thisMonthTime,
    thisMonthDays,
    thisYearTime,
    thisYearDays,
    checkinsPerHour,
    checkinsPerDay,
    setCheckins,
  };
};

export default useCheckin;
