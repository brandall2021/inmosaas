import Link from "next/link";

export default function AuthLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            InmoSaaS
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
