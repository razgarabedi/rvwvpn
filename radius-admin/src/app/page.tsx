"use client"

import dynamic from "next/dynamic"

const RazoRADIUSLayout = dynamic(() => import("@/components/razoradius-layout"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center min-h-screen">Loading...</div>
})

export default function Home() {
  return <RazoRADIUSLayout />
}
