import { auth } from "@/auth";
import { db } from "@/db";
import { HostelCard } from "@/components/housing/hostel-card";
import { redirect } from "next/navigation";

export default async function InternalHousingPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const blocks = await db.query.hostelBlocks.findMany({
    with: {
      rooms: true,
    },
  });

  const enrichedBlocks = blocks.map((block) => ({
    ...block,
    availableRooms: block.rooms.filter(r => r.currentOccupancy < r.capacity).length,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">On-Campus Housing</h1>
        <p className="text-muted-foreground">
          Browse and book available hostel rooms within the university campus.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {enrichedBlocks.map((block) => (
          <HostelCard
            key={block.id}
            id={block.id}
            name={block.name}
            location={block.location}
            genderRestriction={block.genderRestriction}
            images={block.images}
            availableRooms={block.availableRooms}
          />
        ))}
      </div>
      
      {enrichedBlocks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No hostel blocks found.</p>
        </div>
      )}
    </div>
  );
}
