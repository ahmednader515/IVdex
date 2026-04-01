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
            <div className="hidden md:flex h-[calc(100vh-80px)] w-56 flex-col fixed inset-x-0 top-[80px] rtl:right-0 ltr:left-0 z-40">
                <Sidebar />
            </div>
            <main className="md:rtl:pr-56 md:ltr:pl-56 pt-[80px] flex-1 pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0">
                {children}
            </main>
            <DashboardDesktopFooter />
            <MobileBottomNav />
            <SupportFab />
        </div>
     );
}
 
export default DashboardLayout;