-- CreateEnum
CREATE TYPE "CalendarEventFormat" AS ENUM ('IN_PERSON', 'ONLINE');

-- AlterTable
ALTER TABLE "calendar_events" ADD COLUMN     "format" "CalendarEventFormat" NOT NULL DEFAULT 'IN_PERSON',
ADD COLUMN     "meetingUrl" TEXT;
