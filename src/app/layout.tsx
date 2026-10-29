import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
const font = Montserrat({subsets:["latin","cyrillic"],weight:["500","600","700"],variable:"--font-montserrat"});
export const metadata: Metadata = {title:"Treba",description:"TREBA — український маркетплейс"};
export const viewport: Viewport = {width:"device-width",initialScale:1,viewportFit:"cover"};
export const dynamic = "force-dynamic";
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="uk" data-scroll-behavior="smooth"><body className={font.variable}>{children}</body></html>;}
