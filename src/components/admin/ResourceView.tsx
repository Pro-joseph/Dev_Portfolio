"use client";

import ResourcePage from "./ResourcePage";

export default function ResourceView({ resourceKey }: { resourceKey: string }) {
  return <ResourcePage resourceKey={resourceKey} />;
}
