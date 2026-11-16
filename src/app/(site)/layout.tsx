import { Document } from "../shell";

export { metadata, viewport } from "../shell";

/** English pages and the app (wizard, editor, letters). A letter states its own language on its content. */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return <Document lang="en">{children}</Document>;
}
