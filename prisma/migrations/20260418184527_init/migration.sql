-- CreateEnum
CREATE TYPE "RsvpMode" AS ENUM ('household', 'individual');

-- CreateEnum
CREATE TYPE "AuditActorKind" AS ENUM ('guest_token', 'admin');

-- CreateTable
CREATE TABLE "invite" (
    "id" TEXT NOT NULL,
    "tokenVersion" INTEGER NOT NULL DEFAULT 1,
    "rsvpMode" "RsvpMode" NOT NULL DEFAULT 'household',
    "plusOneAllowed" BOOLEAN NOT NULL DEFAULT false,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest" (
    "id" TEXT NOT NULL,
    "inviteId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "isPlusOne" BOOLEAN NOT NULL DEFAULT false,
    "addedByGuest" BOOLEAN NOT NULL DEFAULT false,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "locationName" TEXT NOT NULL,
    "locationAddress" TEXT NOT NULL,
    "locationMapUrl" TEXT,
    "descriptionMarkdown" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invite_event_allowance" (
    "inviteId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "invite_event_allowance_pkey" PRIMARY KEY ("inviteId","eventId")
);

-- CreateTable
CREATE TABLE "menu_course" (
    "id" TEXT NOT NULL,
    "eventId" TEXT,
    "title" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_option" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rsvp_response" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "attending" BOOLEAN NOT NULL,
    "allergiesText" TEXT,
    "songRequestText" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "rsvp_response_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rsvp_menu_selection" (
    "responseId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,

    CONSTRAINT "rsvp_menu_selection_pkey" PRIMARY KEY ("responseId","courseId")
);

-- CreateTable
CREATE TABLE "rsvp_audit_log" (
    "id" TEXT NOT NULL,
    "inviteId" TEXT NOT NULL,
    "guestId" TEXT,
    "eventId" TEXT,
    "action" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "actorKind" "AuditActorKind" NOT NULL,
    "actorRef" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rsvp_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_block" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bodyMarkdown" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByAdmin" TEXT,

    CONSTRAINT "content_block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_setting" (
    "key" TEXT NOT NULL,
    "valueJson" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_setting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "image_asset" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "diskPath" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "image_asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_user" (
    "id" TEXT NOT NULL,
    "oidcSub" TEXT NOT NULL,
    "email" TEXT,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "guest_inviteId_idx" ON "guest"("inviteId");

-- CreateIndex
CREATE UNIQUE INDEX "event_slug_key" ON "event"("slug");

-- CreateIndex
CREATE INDEX "invite_event_allowance_eventId_idx" ON "invite_event_allowance"("eventId");

-- CreateIndex
CREATE INDEX "menu_course_eventId_idx" ON "menu_course"("eventId");

-- CreateIndex
CREATE INDEX "menu_option_courseId_idx" ON "menu_option"("courseId");

-- CreateIndex
CREATE INDEX "rsvp_response_eventId_idx" ON "rsvp_response"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "rsvp_response_guestId_eventId_key" ON "rsvp_response"("guestId", "eventId");

-- CreateIndex
CREATE INDEX "rsvp_menu_selection_optionId_idx" ON "rsvp_menu_selection"("optionId");

-- CreateIndex
CREATE INDEX "rsvp_audit_log_inviteId_occurredAt_idx" ON "rsvp_audit_log"("inviteId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "content_block_key_key" ON "content_block"("key");

-- CreateIndex
CREATE UNIQUE INDEX "admin_user_oidcSub_key" ON "admin_user"("oidcSub");

-- AddForeignKey
ALTER TABLE "guest" ADD CONSTRAINT "guest_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "invite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_event_allowance" ADD CONSTRAINT "invite_event_allowance_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "invite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_event_allowance" ADD CONSTRAINT "invite_event_allowance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_course" ADD CONSTRAINT "menu_course_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_option" ADD CONSTRAINT "menu_option_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "menu_course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rsvp_response" ADD CONSTRAINT "rsvp_response_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rsvp_response" ADD CONSTRAINT "rsvp_response_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rsvp_menu_selection" ADD CONSTRAINT "rsvp_menu_selection_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "rsvp_response"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rsvp_menu_selection" ADD CONSTRAINT "rsvp_menu_selection_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "menu_option"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rsvp_audit_log" ADD CONSTRAINT "rsvp_audit_log_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "invite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rsvp_audit_log" ADD CONSTRAINT "rsvp_audit_log_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rsvp_audit_log" ADD CONSTRAINT "rsvp_audit_log_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
