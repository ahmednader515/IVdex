import { NavbarRoutes } from "@/components/navbar-routes"
import { Logo } from "./logo"

export const Navbar = () => {
    return (
        <div className="p-4 border-b h-full flex items-center bg-card shadow-sm">
            <div className="flex shrink-0 items-center pr-2 md:ml-4">
                <Logo />
            </div>
            <div className="ml-auto flex items-center gap-x-4">
                <NavbarRoutes />
            </div>
        </div>
    )
}