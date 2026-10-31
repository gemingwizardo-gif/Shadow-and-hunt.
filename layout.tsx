import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'ShadowHunt — Real-world Manhunt',
  description: 'Play GPS-powered manhunt with friends.'
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
