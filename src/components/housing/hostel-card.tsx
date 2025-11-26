import Link from "next/link";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemTitle,
} from "@/components/ui/item";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building, Users, MapPin } from "lucide-react";
import Image from "next/image";

interface HostelCardProps {
  id: string;
  name: string;
  location: string | null;
  genderRestriction: "MALE" | "FEMALE" | "MIXED" | null;
  images: string[] | null;
  availableRooms?: number;
}

export function HostelCard({
  id,
  name,
  location,
  genderRestriction,
  images,
  availableRooms,
}: HostelCardProps) {
  const displayImage = images && images.length > 0 ? images[0] : "/placeholder-hostel.jpg";

  return (
    <Item variant="outline" className="h-full">
      <ItemHeader>
        <div className="relative aspect-video w-full bg-muted">
          <Image
            src={displayImage}
            alt={name}
            fill
            className="object-cover transition-transform hover:scale-105"
          />
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
              {genderRestriction || "MIXED"}
            </Badge>
          </div>
        </div>
      </ItemHeader>
      <ItemContent className="flex-grow">
        <ItemTitle className="text-lg">{name}</ItemTitle>
        <div className="flex flex-col gap-2 mt-2 text-sm text-muted-foreground">
          {location && (
            <ItemDescription className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{location}</span>
            </ItemDescription>
          )}
          <ItemDescription className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span>On-Campus Housing</span>
          </ItemDescription>
          {availableRooms !== undefined && (
             <ItemDescription className="flex items-center gap-2">
             <Users className="h-4 w-4" />
             <span>{availableRooms} Rooms Available</span>
           </ItemDescription>
          )}
        </div>
      </ItemContent>
      <div className="pt-2">
        <Button asChild className="w-full" variant="outline">
          <Link href={`/housing/internal/${id}`}>View Rooms</Link>
        </Button>
      </div>
    </Item>
  );
}
