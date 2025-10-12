import Layout from '@/components/Layout'

export default function LayoutTestPage() {
  return (
    <Layout requireAuth={false}>
      <div className="min-h-screen bg-gray-50 p-8">
        <h1 className="text-3xl font-bold text-gray-900">Layout Test Page</h1>
        <p className="text-gray-600">This page uses the Layout component but doesn't require authentication.</p>
      </div>
    </Layout>
  )
}
