import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"

dayjs.extend(utc)
dayjs.extend(timezone)

export const getCurrentDateTime = () => {
  const now = dayjs().tz("Asia/Taipei")
  return now.format("YYYY-MM-DD HH:mm:ss")
}