import { Editor } from "@/components/editor/editor";

export default async function EditPage({ params }: PageProps<"/edit/[id]">) {
  const { id } = await params;
  return <Editor id={id} />;
}
