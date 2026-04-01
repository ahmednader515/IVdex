import Image from "next/image";
import Link from "next/link";

export const Logo = () => {
    return (
        <Link href="/" className="flex items-center shrink-0 py-2">
            <Image
                src="/logo.png"
                alt="Logo"
                width={72}
                height={28}
                className="object-contain object-center"
                unoptimized
            />
        </Link>
    );
};