import type { LoaderFunctionArgs } from "@remix-run/node";
import { Await, Link, defer, useLoaderData } from "@remix-run/react";
import { Suspense } from "react";

export async function loader({ params }: LoaderFunctionArgs) {
  const data = new Promise<string>((r) => setTimeout(() => r("defer"), 1000));
  return defer({ data });
}

export default function AboutPage() {
  const { data } = useLoaderData<typeof loader>();

  return (
    <div>
      <header>
        <h1>About page</h1>
      </header>
      <main>
        <Link to="/">Go back to home</Link>
        <div>
          <Suspense fallback={<div>Loading...</div>}>
            <Await resolve={data}>{(data) => <div>{data}</div>}</Await>
          </Suspense>
        </div>
      </main>
    </div>
  );
}
