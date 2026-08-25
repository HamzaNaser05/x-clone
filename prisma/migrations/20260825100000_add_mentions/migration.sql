ALTER TYPE "NotificationType" ADD VALUE 'mention';

ALTER TABLE "notifications" ADD COLUMN "comment_id" UUID;

CREATE INDEX "notifications_comment_id_idx" ON "notifications"("comment_id");

ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_comment_id_fkey"
FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
