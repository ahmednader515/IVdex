import { Navbar } from "./_components/navbar";
import { Sidebar } from "./_components/sidebar";
import { MobileBottomNav } from "./_components/mobile-bottom-nav";
import { SupportFab } from "./_components/support-fab";
import { DashboardDesktopFooter } from "./_components/dashboard-desktop-footer";

const DashboardLayout = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    return ( 
        <div className="min-h-screen flex flex-col dashboard-layout">
            <div className="h-[80px] fixed inset-x-0 top-0 w-full z-50">
                <Navbar />
            </div>
            <div className="fixed left-0 top-[80px] z-40 hidden h-[calc(100vh-80px)] w-56 flex-col md:flex">
                <Sidebar />
            </div>
            <main className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom,0px))] pt-[80px] md:pb-0 md:pl-56">
                {children}
            </main>
            <DashboardDesktopFooter />
            <MobileBottomNav />
            <SupportFab />
        </div>
     );
}
 
export default DashboardLayout;