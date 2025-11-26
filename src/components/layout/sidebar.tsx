"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GraduationCap, Home, LayoutDashboard, Compass } from "lucide-react";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Academics",
    href: "/academics",
    icon: GraduationCap,
  },
  {
    title: "Explore",
    href: "/academics/explore",
    icon: Compass,
  },
  {
    title: "Housing",
    href: "/housing",
    icon: Home,
  },
];

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: typeof sidebarItems;
  setOpen?: (open: boolean) => void;
}

function SidebarNav({ items, className, setOpen, ...props }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("space-y-1", className)} {...props}>
      {items.map((item) => (
        <Button
          key={item.href}
          variant={pathname === item.href || pathname.startsWith(item.href + "/") ? "secondary" : "ghost"}
          className="w-full justify-start"
          asChild
          onClick={() => setOpen?.(false)}
        >
          <Link href={item.href}>
            <item.icon className="mr-2 h-4 w-4" />
            {item.title}
          </Link>
        </Button>
      ))}
    </nav>
  );
}

interface SidebarProps {
  role?: string;
}

export function Sidebar({ role }: SidebarProps) {
  const filteredItems = sidebarItems.filter(item => {
    if (item.title === "Explore" && (role === "ADMIN" || role === "FACULTY")) {
      return false;
    }
    return true;
  });

  return (
    <div className="pb-12 w-64 border-r min-h-[calc(100vh-4rem)] hidden md:block">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Services
          </h2>
          <SidebarNav items={filteredItems} />
        </div>
      </div>
    </div>
  );
}

export function SidebarSheet({ role }: SidebarProps) {
  const [open, setOpen] = useState(false);

  const filteredItems = sidebarItems.filter(item => {
    if (item.title === "Explore" && (role === "ADMIN" || role === "FACULTY")) {
      return false;
    }
    return true;
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="mr-2 md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="px-3 py-6">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Services
          </h2>
          <SidebarNav items={filteredItems} setOpen={setOpen} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
