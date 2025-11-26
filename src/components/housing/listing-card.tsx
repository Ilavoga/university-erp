import Link from "next/link";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Badge } from "@/components/ui/badge";
import { MapPin, User } from "lucide-react";
import Image from "next/image";

interface ListingCardProps {
  id: string;
  title: string;
  location: string;
  price: number;
  images: string[] | null;
  isAvailable: boolean;
  landlordName?: string;
}

export function ListingCard({
  id,
  title,
  location,
  price,
  images,
  isAvailable,
  landlordName,
}: ListingCardProps) {
  const displayImage = images && images.length > 0 ? images[0] : "/placeholder-house.jpg";
  // Check if it's an external URL (Supabase signed URLs) - skip Next.js optimization for these
  const isExternalUrl = displayImage.startsWith("http");

  return (
    <Item variant="outline" asChild className="w-full hover:bg-accent/50">
      <Link href={`/housing/external/${id}`} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <ItemMedia variant="image" className="h-24 w-24 shrink-0">
          <Image
            src={displayImage}
            alt={title}
            width={96}
            height={96}
            className="h-full w-full object-cover"
            unoptimized={isExternalUrl}
          />
        </ItemMedia>
        <ItemContent className="flex-1 min-w-0">
          <ItemTitle className="text-lg truncate">
            {title}
          </ItemTitle>
          <ItemDescription className="flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3" /> {location}
          </ItemDescription>
          {landlordName && (
            <ItemDescription className="flex items-center gap-1">
              <User className="h-3 w-3" /> {landlordName}
            </ItemDescription>
          )}
        </ItemContent>
        <ItemContent className="flex-none w-full sm:w-auto text-left sm:text-right mt-2 sm:mt-0">
          <ItemTitle className="text-primary text-lg">
            KES {price.toLocaleString()}
          </ItemTitle>
          <ItemDescription>per month</ItemDescription>
          <div className="mt-2">
            <Badge variant={isAvailable ? "default" : "destructive"}>
              {isAvailable ? "Available" : "Rented"}
            </Badge>
          </div>
        </ItemContent>
      </Link>
    </Item>
  );
}
