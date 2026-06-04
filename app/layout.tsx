import './globals.css';
import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { RestaurantProvider } from '@/context/RestaurantContext';
export const metadata: Metadata = { title: 'WineCellar', description: 'Gestione cantina vini' };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="it"><body><RestaurantProvider>{children}<Toaster richColors position="top-right" /></RestaurantProvider></body></html>}
