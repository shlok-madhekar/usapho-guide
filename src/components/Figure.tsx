"use client";

import { useId } from "react";

/**
 * A numbered figure. Interactive sims are wrapped in this so they read as
 * part of the text rather than as widgets bolted onto it.
 */
export default function Figure({
  caption,
  children,
}: {
  caption: React.ReactNode;
  children: React.ReactNode;
}) {
  const id = useId();
  return (
    <figure className="figure" id={id}>
      {children}
      <figcaption className="figure-caption">{caption}</figcaption>
    </figure>
  );
}
