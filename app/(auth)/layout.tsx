export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-xl font-bold tracking-tight text-brand-700">
            AxonBr <span className="text-gray-900">Company CRM</span>
          </span>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card">
          {children}
        </div>
      </div>
    </div>
  );
}
