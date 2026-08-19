-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'reply';

-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "parent_id" UUID;

-- CreateIndex
CREATE INDEX "comments_parent_id_created_at_idx" ON "comments"("parent_id", "created_at");

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
