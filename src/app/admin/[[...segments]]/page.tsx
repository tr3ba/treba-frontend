import Workspace from "@/features/admin/Workspace";
export default async function AdminPage({ params }: { params: Promise<{ segments?: string[] }> }) { const { segments = [] } = await params; return <Workspace segments={segments} />; }
