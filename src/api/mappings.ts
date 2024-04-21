export interface KeyName {
  key: string;
  name: string;
}

export interface KeyNameNum {
  key: string;
  name: string;
  num: number;
}

export interface KeyNameValue {
  key: string;
  name: string;
  value: number;
  display?: string;
  className?: string;
}



export const weekDayName = (num = 1, mode = "iso") => {
  const isoNum = mode === "sun" ? (num === 1 ? 7 : num - 1) : num;
  switch (isoNum) {
    case 1:
      return "Monday";
    case 2:
      return "Tuesday";
    case 3:
      return "Wednesday";
    case 4:
      return "Thursday";
    case 5:
      return "Friday";
    case 6:
      return "Saturday";
    case 7:
      return "Sunday";
    default:
      return "-";
  }
};

export const weekDayNameSun = (num = 1) => weekDayName(num, "sun");


