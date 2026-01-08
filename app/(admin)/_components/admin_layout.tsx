"use client";

import { cn } from "@/shared/utils/cn";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  GaugeIcon,
  HomeIcon,
  LogOutIcon,
  NotebookTextIcon,
  SettingsIcon,
  Table2Icon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";

const sidebarItems = [
  {
    text: "Admin Dashboard",
    link: "/admin",
    icon: GaugeIcon,
  },
  { text: "Home", link: "/", icon: HomeIcon },
  {
    text: "Custom Page",
    link: "/admin/custom-page",
    icon: NotebookTextIcon,
  },
  { text: "Users", link: "/admin/users", icon: UserIcon },
  { text: "Posts", link: "/admin/posts", icon: Table2Icon },
  {
    text: "Categories",
    link: "/admin/categories",
    icon: Table2Icon,
  },
  { text: "Tags", link: "/admin/tags", icon: Table2Icon },
  {
    text: "Post Tags",
    link: "/admin/posts-tags",
    icon: Table2Icon,
  },
  { text: "Settings", link: "/admin/settings", icon: SettingsIcon },
  { text: "Sign out", link: "/signout", icon: LogOutIcon },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  interface SidebarItem {
    text: string;
    link: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }

  const renderSidebarItems = (items: SidebarItem[]) => {
    return items.map((item) => {
      const Icon = item.icon;
      const isActive = pathname === item.link;
      return (
        <li key={item.link}>
          <Link
            href={item.link}
            className={cn(
              "hover:bg-gray-100 flex items-center rounded-md transition-colors",
              sidebarCollapsed ? "justify-center px-3 py-3" : "gap-3 px-3 py-2",
              isActive && "bg-gray-100 text-gray-700"
            )}
          >
            <Icon size={20} className="shrink-0" />
            {!sidebarCollapsed && <span>{item.text}</span>}
          </Link>
        </li>
      );
    });
  };

  return (
    <div className="bg-white flex min-h-screen text-black dark:text-white">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-white border-gray-200 flex flex-col border-r transition-all duration-300",
          sidebarCollapsed ? "w-16" : "min-w-64"
        )}
      >
        {/* Sidebar Header */}
        <div className="border-gray-200 flex items-center justify-between border-b p-4">
          {!sidebarCollapsed && (
            <h1 className="text-lg font-semibold">Drizzle Admin</h1>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(
              "rounded-md p-2 hover:bg-gray-100 transition-colors",
              "flex items-center justify-center"
            )}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronRightIcon size={20} />
            ) : (
              <ChevronLeftIcon size={20} />
            )}
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="p-4 flex-1">
          <ul className="space-y-2">{renderSidebarItems(sidebarItems)}</ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col">
        <div className="flex-1 p-6">{children}</div>
      </main>
    </div>
  );
}
