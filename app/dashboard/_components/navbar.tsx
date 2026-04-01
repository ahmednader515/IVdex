import { NavbarRoutes } from "@/components/navbar-routes"
import { Logo } from "./logo"

export const Navbar = () => {
    return (
        <div className="p-4 border-b h-full flex items-center bg-card shadow-sm">
            <div className="flex shrink-0 items-center rtl:pl-2 ltr:pr-2 md:rtl:mr-4 md:ltr:ml-4 md:rtl:pl-0 md:ltr:pr-0">
                <Logo />
            </div>
            <div className="flex items-center gap-x-4 rtl:mr-auto ltr:ml-auto">
                <NavbarRoutes />
            </div>
        </div>
    )
}