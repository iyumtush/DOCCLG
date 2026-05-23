-- AlterTable
ALTER TABLE "Request" ADD COLUMN "certificateId" TEXT;
ALTER TABLE "Request" ADD COLUMN "certificateUrl" TEXT;
ALTER TABLE "Request" ADD COLUMN "classInchargeComment" TEXT;
ALTER TABLE "Request" ADD COLUMN "hodComment" TEXT;

-- CreateIndex
CREATE INDEX "Request_branch_idx" ON "Request"("branch");
