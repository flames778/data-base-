-- AddForeignKey
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
