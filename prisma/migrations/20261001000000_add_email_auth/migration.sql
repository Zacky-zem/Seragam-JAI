ALTER TABLE "public"."User"
ADD COLUMN "email" TEXT,
ADD COLUMN "resetPasswordToken" TEXT,
ADD COLUMN "resetPasswordExpires" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");
CREATE UNIQUE INDEX "User_resetPasswordToken_key" ON "public"."User"("resetPasswordToken");