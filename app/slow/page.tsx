export const dynamic = 'force-dynamic'

export default async function Slow() {
  // Any await long enough for the server to flush the shell first is enough.
  // 50ms is plenty; a real app hits this with a normal database query.
  await new Promise((resolve) => setTimeout(resolve, 50))

  return (
    <section>
      <h1>CONTENT-OK</h1>
      <p>If you can read this, the Suspense boundary resolved.</p>
    </section>
  )
}
