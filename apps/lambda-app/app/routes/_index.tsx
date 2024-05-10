import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { useState } from "react";

export const meta: MetaFunction = () => {
  return [{ title: "New Remix App" }, { name: "description", content: "Welcome to Remix!" }];
};

export default function Index() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <header>
        <h1>cloudfront - lambda</h1>
      </header>
      <main>
        <p>{count}</p>
        <button type="button" onClick={() => setCount((c) => c + 1)}>
          +1
        </button>
        <Link to="/about">Go about</Link>
      </main>
    </div>
  );
}
