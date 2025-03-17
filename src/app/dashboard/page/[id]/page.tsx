import { PlateEditor } from "@/components/editor/plate-editor";
import { SettingsProvider } from "@/components/editor/settings";

interface Props {
  params: {
    id: string;
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;

  return (
    <>
      <div className="h-screen w-full" data-registry="plate">
        <SettingsProvider>
          <PlateEditor />
        </SettingsProvider>
      </div>
    </>
  );
}
