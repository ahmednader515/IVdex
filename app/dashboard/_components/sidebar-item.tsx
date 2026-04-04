"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useNavigationRouter } from "@/lib/hooks/use-navigation-router";
import { SheetClose } from "@/components/ui/sheet";
import { isDashboardSectionActive } from "@/lib/dashboard-nav";

interface SidebarItemProps {
    icon: LucideIcon;
    label: string;
    href: string;
    /** Current URL search string (e.g. from useSearchParams) for tab-aware active state */
    urlSearch?: string;
    closeOnClick?: boolean;
}

export const SidebarItem = ({
    icon: Icon,
    label,
    href,
    urlSearch = "",
    closeOnClick = false
}: SidebarItemProps) => {

    const pathName = usePathname();
    const router = useNavigationRouter();

    const isActive = pathName ? isDashboardSectionActive(pathName, href, urlSearch || null) : false;

    const onClick = () => {
        if (!isActive) router.push(href);
    }

    const ButtonEl = (
        <button
            onClick={onClick}
            type="button"
            data-navigation="true"
            className={cn(
                "flex items-center gap-x-2 pl-6 text-sm font-[500] text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary",
                isActive && "text-primary bg-primary/10 hover:bg-primary/10"
            )}
        >
            <div className="flex items-center gap-x-2 py-3">
                <Icon 
                    size={22} 
                    className={cn(
                        "text-muted-foreground",
                        isActive && "text-primary"
                    )} 
                />
                {label}
            </div>

            <div 
                className={cn(
                    "ml-auto h-full border-2 border-primary opacity-0 transition-all",
                    isActive && "opacity-100"
                )}
            />
        </button>
    );

    return closeOnClick ? (
        <SheetClose asChild>
            {ButtonEl}
        </SheetClose>
    ) : (
        ButtonEl
    );
}