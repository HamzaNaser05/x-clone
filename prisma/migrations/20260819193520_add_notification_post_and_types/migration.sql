-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'comment';
ALTER TYPE "NotificationType" ADD VALUE 'repost';

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "post_id" UUID;

-- CreateIndex
CREATE INDEX "notifications_to_user_id_read_idx" ON "notifications"("to_user_id", "read");

-- CreateIndex
CREATE INDEX "notifications_post_id_idx" ON "notifications"("post_id");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
