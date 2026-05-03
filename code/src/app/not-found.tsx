import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1>404 - Not Found</h1>
      <Link href="/">Go home</Link>
    </div>
  );
}
