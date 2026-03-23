"use client";

import dayjs from "dayjs";
import "dayjs/locale/es";
import { useEffect } from "react";

/** Spanish locale for relative dates shown in the UI (dayjs). */
export function LocaleBootstrap() {
  useEffect(() => {
    dayjs.locale("es");
  }, []);
  return null;
}
