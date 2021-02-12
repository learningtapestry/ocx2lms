import React, { useState } from "react";
import Head from "next/head";
import { signIn, signOut, useSession } from "next-auth/client";
import styles from "../styles/Home.module.css";
import { Course } from "src/types";

export default function Home() {
  const [session, _loading] = useSession();
  const [courses, setCourses] = useState(null);

  const onClick = async () => {
    const response = await fetch("/api/courses");
    const res = await response.json();
    setCourses(res.courses);
  };
  const onSignOut = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    signOut().then(() => location.reload());
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>OCX - Classroom</title>
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>OCX - Classroom</h1>
        <div>
          {session ? (
            <>
              <p>
                <span>Welcome, {session.user?.name}.</span>
                <a href="#" onClick={onSignOut} style={{ marginLeft: "2em" }}>
                  [Log out]
                </a>
              </p>
              <p>
                <button onClick={onClick}>List courses</button>
              </p>
            </>
          ) : (
            <button onClick={() => signIn("google")}>log in</button>
          )}
        </div>
        <div>
          {courses?.length &&
            courses.map((course: Course, i: number) => (
              <p key={`course-${i}`}>
                {course.id} - {course.name}
              </p>
            ))}
        </div>
      </main>
    </div>
  );
}
