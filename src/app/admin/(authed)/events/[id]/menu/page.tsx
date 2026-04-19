import Link from "next/link";
import { notFound } from "next/navigation";

import { getEventById } from "@/lib/content/event";
import { listMenuCoursesForEvent } from "@/lib/rsvp/menu";
import { getPrismaClient } from "@/server/db";

import { CourseEditor } from "./course-editor";
import { NewCourseForm } from "./new-course-form";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface Params {
  id: string;
}

export default async function EventMenuPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const [eventResult, coursesResult] = await Promise.all([
    getEventById(getPrismaClient(), id),
    listMenuCoursesForEvent(getPrismaClient(), id),
  ]);

  if (eventResult.isErr()) {
    if (eventResult.error.kind === "not_found") notFound();
    throw new Error(`Failed to load event: ${eventResult.error.kind}`);
  }
  if (coursesResult.isErr()) {
    throw new Error(`Failed to load menu: ${coursesResult.error.kind}`);
  }

  const event = eventResult.value;
  const courses = coursesResult.value;
  const eventCourses = courses.filter((course) => course.eventId === event.id);
  const globalCourses = courses.filter((course) => course.eventId === null);

  return (
    <section className="mx-auto max-w-4xl space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-3xl">Menu · {event.title}</h2>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
            {event.slug}
          </p>
        </div>
        <Link
          href={`/admin/events/${event.id}`}
          className="text-sm uppercase tracking-[0.2em] text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]"
        >
          Back to event
        </Link>
      </header>

      <section className="space-y-4">
        <h3 className="font-serif text-xl">Courses for this event</h3>
        {eventCourses.length === 0 ? (
          <p className="text-sm text-[color:var(--color-muted)]">No courses yet.</p>
        ) : (
          <div className="space-y-4">
            {eventCourses.map((course) => (
              <CourseEditor key={course.id} eventId={event.id} course={course} />
            ))}
          </div>
        )}
        <NewCourseForm eventId={event.id} nextOrderIndex={eventCourses.length} />
      </section>

      {globalCourses.length > 0 ? (
        <section className="space-y-4">
          <h3 className="font-serif text-xl">Global courses</h3>
          <p className="text-xs text-[color:var(--color-muted)]">
            Shared across all events. Edit them from the event they were created under.
          </p>
          <ul className="mt-2 divide-y divide-[color:var(--color-ink)]/10 rounded border border-[color:var(--color-ink)]/10">
            {globalCourses.map((course) => (
              <li key={course.id} className="px-4 py-3 text-sm">
                <span className="font-serif text-base">{course.title}</span>
                <span className="ml-3 text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                  {course.options.length} option{course.options.length === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}
