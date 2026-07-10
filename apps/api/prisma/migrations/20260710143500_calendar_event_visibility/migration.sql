-- CreateEnum
CREATE TYPE "CalendarEventVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- AlterTable
ALTER TABLE "calendar_events" ADD COLUMN "visibility" "CalendarEventVisibility" NOT NULL DEFAULT 'PRIVATE';

-- AlterTable
ALTER TABLE "meetings" ADD COLUMN "calendarEventId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "meetings_calendarEventId_key" ON "meetings"("calendarEventId");

-- CreateIndex
CREATE INDEX "calendar_events_visibility_idx" ON "calendar_events"("visibility");

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_calendarEventId_fkey" FOREIGN KEY ("calendarEventId") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
