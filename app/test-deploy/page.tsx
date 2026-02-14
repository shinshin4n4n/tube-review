export default function TestDeployPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">デプロイテスト</h1>
      <p>このページが表示されていれば、最新のデプロイが反映されています。</p>
      <p className="mt-4">
        ビルド時刻: {new Date().toISOString()}
      </p>
    </div>
  );
}
